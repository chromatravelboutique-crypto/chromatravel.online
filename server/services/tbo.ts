import { z } from 'zod';

const TBO_CONFIG = {
  baseUrl: process.env.TBO_BASE_URL || 'http://api.tbotechnology.in/TBOHolidays_HotelAPI',
  clientId: process.env.TBO_CLIENT_ID || process.env.TBO_USERNAME,
  apiKey: process.env.TBO_API_KEY || process.env.TBO_PASSWORD,
  timeout: 60000,
};

function validateTBOConfig(): { valid: boolean; error?: string } {
  if (!TBO_CONFIG.clientId || !TBO_CONFIG.apiKey) {
    return { valid: false, error: 'TBO API credentials not configured. Please set TBO_CLIENT_ID and TBO_API_KEY environment variables.' };
  }
  return { valid: true };
}

const searchRequestSchema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  cityCode: z.string().optional(),
  nationality: z.string().default('MX'),
  rooms: z.array(z.object({
    adults: z.number().min(1).max(6),
    children: z.number().min(0).max(4).default(0),
    childrenAges: z.array(z.number()).optional(),
  })),
  hotelCodes: z.array(z.string()).optional(),
  starRating: z.number().min(1).max(5).optional(),
  maxResults: z.number().default(50),
});

export type TBOSearchRequest = z.infer<typeof searchRequestSchema>;

interface TBORoom {
  RoomIndex?: number;
  RoomTypeCode?: string;
  RoomTypeName?: string;
  RatePlanCode?: string;
  RatePlanName?: string;
  Name?: string[];
  BookingCode?: string;
  Inclusion: string;
  DayRates: Array<{ Date?: string; BasePrice: number }[] | { Date?: string; BasePrice: number }>;
  TotalFare: number;
  TotalTax: number;
  RoomPromotion?: string | string[];
  MealType?: string;
  IsRefundable?: boolean;
  CancelPolicies: Array<{
    FromDate: string;
    ToDate?: string;
    ChargeType: string;
    CancellationCharge: number;
  }>;
  Amenities?: string[];
  WithTransfers: boolean;
}

interface TBOHotel {
  HotelCode: string;
  HotelName?: string;
  StarRating?: number;
  Address?: string;
  Latitude?: string;
  Longitude?: string;
  HotelPicture?: string;
  Currency?: string;
  Rooms: TBORoom[];
}

interface TBOSearchResponse {
  Status: {
    Code: number;
    Description: string;
  };
  HotelResult: TBOHotel[];
}

export class TBOService {
  private baseUrl: string;
  private clientId: string;
  private apiKey: string;
  private markupPercent: number;

  constructor(markupPercent: number = 15) {
    this.baseUrl = TBO_CONFIG.baseUrl;
    this.clientId = TBO_CONFIG.clientId || '';
    this.apiKey = TBO_CONFIG.apiKey || '';
    this.markupPercent = markupPercent;
  }
  
  static validateConfig(): { valid: boolean; error?: string } {
    return validateTBOConfig();
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.clientId}:${this.apiKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private applyMarkup(price: number): number {
    return Math.ceil(price * (1 + this.markupPercent / 100));
  }

  setMarkup(percent: number): void {
    this.markupPercent = percent;
  }

  getMarkup(): number {
    return this.markupPercent;
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.apiKey);
  }

  async search(params: TBOSearchRequest): Promise<{
    success: boolean;
    hotels?: Array<{
      hotelCode: string;
      hotelName: string;
      starRating: number;
      address: string;
      latitude: string;
      longitude: string;
      image: string;
      rooms: Array<{
        roomIndex: number;
        roomType: string;
        ratePlan: string;
        inclusion: string;
        originalPrice: number;
        finalPrice: number;
        tax: number;
        amenities: string[];
        cancelPolicies: Array<{
          fromDate: string;
          toDate: string;
          chargeType: string;
          charge: number;
        }>;
      }>;
      lowestPrice: number;
    }>;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'TBO API not configured. Please add credentials.' };
    }

    try {
      const paxRooms = params.rooms.map((room) => ({
        Adults: room.adults,
        Children: room.children || 0,
        ChildrenAges: room.childrenAges || [],
      }));

      const requestBody: Record<string, any> = {
        CheckIn: params.checkIn,
        CheckOut: params.checkOut,
        GuestNationality: params.nationality,
        PaxRooms: paxRooms,
        ResponseTime: 23,
        IsDetailedResponse: true,
        Filters: {
          Refundable: false,
          NoOfRooms: 0,
          MealType: 'All',
        },
      };

      if (params.hotelCodes && params.hotelCodes.length > 0) {
        requestBody.HotelCodes = params.hotelCodes.join(',');
      } else if (params.cityCode) {
        requestBody.CityCode = params.cityCode;
      }

      const response = await fetch(`${this.baseUrl}/Search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`TBO API error: ${response.status}`);
      }

      const data: TBOSearchResponse = await response.json();

      if (data.Status.Code !== 200) {
        return { success: false, error: data.Status.Description };
      }

      const hotels = (data.HotelResult || []).map(hotel => {
        const rooms = hotel.Rooms.map((room, idx) => {
          const roomName = room.Name?.[0] || room.RoomTypeName || 'Habitación estándar';
          return {
            roomIndex: room.RoomIndex ?? idx,
            roomType: roomName,
            ratePlan: room.RatePlanName || room.MealType || 'Standard',
            inclusion: room.Inclusion,
            originalPrice: room.TotalFare,
            finalPrice: this.applyMarkup(room.TotalFare),
            tax: room.TotalTax,
            amenities: room.Amenities || [],
            bookingCode: room.BookingCode,
            isRefundable: room.IsRefundable ?? false,
            cancelPolicies: (room.CancelPolicies || []).map(cp => ({
              fromDate: cp.FromDate,
              toDate: cp.ToDate || '',
              chargeType: cp.ChargeType,
              charge: cp.CancellationCharge,
            })),
          };
        });

        const lowestPrice = rooms.length > 0 
          ? Math.min(...rooms.map(r => r.finalPrice))
          : 0;

        return {
          hotelCode: hotel.HotelCode,
          hotelName: hotel.HotelName || `Hotel ${hotel.HotelCode}`,
          starRating: hotel.StarRating || 4,
          address: hotel.Address || 'Ubicación disponible al confirmar',
          latitude: hotel.Latitude || '',
          longitude: hotel.Longitude || '',
          image: hotel.HotelPicture || '',
          currency: hotel.Currency || 'USD',
          rooms,
          lowestPrice,
        };
      });

      return { success: true, hotels };
    } catch (error) {
      console.error('TBO Search error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async prebook(hotelCode: string, roomIndex: number, roomTypeCode: string, ratePlanCode: string): Promise<{
    success: boolean;
    prebookId?: string;
    roomDetails?: {
      roomType: string;
      ratePlan: string;
      originalPrice: number;
      finalPrice: number;
      cancelPolicies: Array<{
        fromDate: string;
        toDate: string;
        chargeType: string;
        charge: number;
      }>;
    };
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'TBO API not configured' };
    }

    try {
      const requestBody = {
        HotelCode: hotelCode,
        RoomIndex: roomIndex,
        RoomTypeCode: roomTypeCode,
        RatePlanCode: ratePlanCode,
      };

      const response = await fetch(`${this.baseUrl}/PreBook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`TBO PreBook error: ${response.status}`);
      }

      const data = await response.json();

      if (data.Status.Code !== 200) {
        return { success: false, error: data.Status.Description };
      }

      return {
        success: true,
        prebookId: data.PreBookingId,
        roomDetails: {
          roomType: data.RoomTypeName,
          ratePlan: data.RatePlanName,
          originalPrice: data.TotalFare,
          finalPrice: this.applyMarkup(data.TotalFare),
          cancelPolicies: (data.CancelPolicies || []).map((cp: any) => ({
            fromDate: cp.FromDate,
            toDate: cp.ToDate,
            chargeType: cp.ChargeType,
            charge: cp.CancellationCharge,
          })),
        },
      };
    } catch (error) {
      console.error('TBO PreBook error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async book(params: {
    prebookId: string;
    guests: Array<{
      title: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      isLeadGuest: boolean;
    }>;
    specialRequest?: string;
  }): Promise<{
    success: boolean;
    confirmationNumber?: string;
    bookingStatus?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'TBO API not configured' };
    }

    try {
      const requestBody = {
        PreBookingId: params.prebookId,
        GuestDetails: params.guests.map(g => ({
          Title: g.title,
          FirstName: g.firstName,
          LastName: g.lastName,
          Email: g.email,
          PhoneNo: g.phone,
          IsLeadGuest: g.isLeadGuest,
        })),
        SpecialRequest: params.specialRequest || '',
        PaymentMode: 'Limit',
      };

      const response = await fetch(`${this.baseUrl}/Book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`TBO Book error: ${response.status}`);
      }

      const data = await response.json();

      if (data.Status.Code !== 200) {
        return { success: false, error: data.Status.Description };
      }

      return {
        success: true,
        confirmationNumber: data.ConfirmationNumber,
        bookingStatus: data.BookingStatus,
      };
    } catch (error) {
      console.error('TBO Book error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getBookingDetails(confirmationNumber: string): Promise<{
    success: boolean;
    booking?: {
      confirmationNumber: string;
      hotelName: string;
      checkIn: string;
      checkOut: string;
      roomType: string;
      status: string;
      totalAmount: number;
      guests: Array<{ name: string; email: string }>;
    };
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'TBO API not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/BookingDetail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({ ConfirmationNumber: confirmationNumber }),
      });

      if (!response.ok) {
        throw new Error(`TBO BookingDetail error: ${response.status}`);
      }

      const data = await response.json();

      if (data.Status.Code !== 200) {
        return { success: false, error: data.Status.Description };
      }

      return {
        success: true,
        booking: {
          confirmationNumber: data.ConfirmationNumber,
          hotelName: data.HotelName,
          checkIn: data.CheckIn,
          checkOut: data.CheckOut,
          roomType: data.RoomTypeName,
          status: data.BookingStatus,
          totalAmount: data.TotalAmount,
          guests: (data.GuestDetails || []).map((g: any) => ({
            name: `${g.FirstName} ${g.LastName}`,
            email: g.Email,
          })),
        },
      };
    } catch (error) {
      console.error('TBO BookingDetail error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async cancelBooking(confirmationNumber: string, remarks: string = 'Customer request'): Promise<{
    success: boolean;
    cancellationNumber?: string;
    refundAmount?: number;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'TBO API not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/Cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          ConfirmationNumber: confirmationNumber,
          Remarks: remarks,
        }),
      });

      if (!response.ok) {
        throw new Error(`TBO Cancel error: ${response.status}`);
      }

      const data = await response.json();

      if (data.Status.Code !== 200) {
        return { success: false, error: data.Status.Description };
      }

      return {
        success: true,
        cancellationNumber: data.CancellationNumber,
        refundAmount: data.RefundAmount,
      };
    } catch (error) {
      console.error('TBO Cancel error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCountryList(): Promise<{
    success: boolean;
    countries?: Array<{ code: string; name: string }>;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'TBO API not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/CountryList`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`TBO CountryList error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        countries: (data.CountryList || []).map((c: any) => ({
          code: c.Code,
          name: c.Name,
        })),
      };
    } catch (error) {
      console.error('TBO CountryList error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCityList(countryCode: string): Promise<{
    success: boolean;
    cities?: Array<{ code: string; name: string }>;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'TBO API not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/CityList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({ CountryCode: countryCode }),
      });

      if (!response.ok) {
        throw new Error(`TBO CityList error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        cities: (data.CityList || []).map((c: any) => ({
          code: c.Code,
          name: c.Name,
        })),
      };
    } catch (error) {
      console.error('TBO CityList error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const tboService = new TBOService();
