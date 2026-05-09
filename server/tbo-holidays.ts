/**
 * TBO Holidays API Integration
 * Version 2.1 - Ready for credentials
 * 
 * API Flow: Search → PreBook → Book → BookingDetail/Cancel
 * 
 * Test BaseURL: http://api.tbotechnology.in/TBOHolidays_HotelAPI
 * Live BaseURL: {Live-URL}/HotelAPI (provided with credentials)
 */

// Types for TBO API
export interface TBOSearchRequest {
  CheckIn: string;           // YYYY-MM-DD
  CheckOut: string;          // YYYY-MM-DD
  HotelCodes: string;        // Comma separated TBO hotel codes
  GuestNationality: string;  // ISO 3166-1 alpha-2 (e.g., MX, US, AE)
  PaxRooms: TBOPaxRoom[];
  ResponseTime?: number;     // Recommended: 23 seconds
  IsDetailedResponse?: boolean;
  Filters?: TBOSearchFilters;
}

export interface TBOPaxRoom {
  Adults: number;            // 1-8
  Children: number;          // 0-4
  ChildrenAges?: number[];   // Ages 0-18
}

export interface TBOSearchFilters {
  Refundable?: boolean;
  NoOfRooms?: number;
  MealType?: 'All' | 'WithMeal' | 'RoomOnly';
}

export interface TBOSearchResponse {
  Status: TBOStatus;
  HotelResult?: TBOHotelResult[];
}

export interface TBOStatus {
  Code: number;
  Description: string;
}

export interface TBOHotelResult {
  HotelCode: string;
  Currency: string;
  Rooms: TBORoom[];
}

export interface TBORoom {
  Name: string[];
  BookingCode: string;
  Inclusion?: string;
  DayRates?: { BasePrice: number }[][];
  TotalFare: number;
  TotalTax: number;
  ExtraGuestCharges?: string;
  RecommendedSellingRate?: string;
  RoomPromotion?: string[];
  CancelPolicies?: TBOCancelPolicy[];
  MealType: string;
  IsRefundable: boolean;
  Supplements?: TBOSupplement[][];
  WithTransfers: boolean;
  Amenities?: string[];
}

export interface TBOCancelPolicy {
  Index?: string;
  FromDate: string;
  ChargeType: string;
  CancellationCharge: number;
}

export interface TBOSupplement {
  Index: number;
  Type: 'Included' | 'AtProperty';
  Description: string;
  Price: number;
  Currency: string;
}

export interface TBOPreBookRequest {
  BookingCode: string;
  PaymentMode?: 'Limit' | 'NewCard' | 'SavedCard';
}

export interface TBOPreBookResponse {
  Status: TBOStatus;
  HotelResult?: TBOHotelResult[];
  RateConditions?: string[];
  CreditCardBillingOptions?: TBOCreditCardOption[];
}

export interface TBOCreditCardOption {
  Currency: string;
  Amount: number;
  ConvenienceCharges: number;
}

export interface TBOBookRequest {
  BookingCode: string;
  CustomerDetails: TBOCustomerDetail[];
  PaymentMode: 'Limit' | 'NewCard' | 'SavedCard';
  BookingReferenceId?: string;
  CardDetails?: TBOCardDetails;
}

export interface TBOCustomerDetail {
  CustomerNames: TBOCustomerName[];
}

export interface TBOCustomerName {
  Title: 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Mstr';
  FirstName: string;
  LastName: string;
  Type: 'Adult' | 'Child';
}

export interface TBOCardDetails {
  CardHolderFirstName: string;
  CardHolderLastName: string;
  CardNumber: string;
  CardExpiryMonth: string;
  CardExpiryYear: string;
  CardCVVNumber: string;
  BillingAmount: number;
  BillingCurrency: string;
}

export interface TBOBookResponse {
  Status: TBOStatus;
  ConfirmationNumber?: string;
  BookingStatus?: string;
  HotelConfirmationNumber?: string;
  HotelRemarks?: string;
}

export interface TBOCancelRequest {
  ConfirmationNumber: string;
  Remarks?: string;
}

export interface TBOCancelResponse {
  Status: TBOStatus;
  CancelConfirmationNumber?: string;
  CancellationCharges?: number;
}

export interface TBOBookingDetailRequest {
  ConfirmationNumber?: string;
  BookingReferenceId?: string;
}

export interface TBOBookingDetailResponse {
  Status: TBOStatus;
  BookingDetails?: TBOBookingDetails;
}

export interface TBOBookingDetails {
  ConfirmationNumber: string;
  BookingReferenceId?: string;
  BookingStatus: string;
  HotelCode: string;
  HotelName?: string;
  CheckIn: string;
  CheckOut: string;
  Rooms: TBOBookedRoom[];
  TotalFare: number;
  Currency: string;
}

export interface TBOBookedRoom {
  RoomName: string;
  Guests: TBOCustomerName[];
}

// Static data endpoints
export interface TBOCountryListResponse {
  Status: TBOStatus;
  CountryList?: { Code: string; Name: string }[];
}

export interface TBOCityListRequest {
  CountryCode: string;
}

export interface TBOCityListResponse {
  Status: TBOStatus;
  CityList?: { Code: string; Name: string }[];
}

export interface TBOHotelCodeListRequest {
  CityCode: string;
  IsDetailedResponse?: boolean;
}

export interface TBOHotelDetailsRequest {
  Hotelcodes: string;
  Language?: string;
}

export interface TBOHotelDetailsResponse {
  Status: TBOStatus;
  Hotels?: TBOHotelDetail[];
}

export interface TBOHotelDetail {
  HotelCode: string;
  HotelName: string;
  Description?: string;
  HotelRating: number;
  Address: string;
  City: string;
  Country: string;
  Latitude?: string;
  Longitude?: string;
  CheckInTime?: string;
  CheckOutTime?: string;
  Images?: string[];
  Amenities?: string[];
}

/**
 * TBO Holidays API Client
 * Uses Basic Auth with username/password provided by TBO
 */
export class TBOHolidaysClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private isConfigured: boolean;

  constructor() {
    this.baseUrl = process.env.TBO_BASE_URL || 'http://api.tbotechnology.in/TBOHolidays_HotelAPI';
    this.username = process.env.TBO_USERNAME || '';
    this.password = process.env.TBO_PASSWORD || '';
    this.isConfigured = !!(this.username && this.password);
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.username}:${this.password}`).toString('base64');
  }

  private async request<T>(endpoint: string, body: any, timeout: number = 30000, method: 'GET' | 'POST' = 'POST'): Promise<T> {
    if (!this.isConfigured) {
      throw new Error('TBO_CREDENTIALS_NOT_CONFIGURED');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': this.getAuthHeader(),
        },
        signal: controller.signal,
      };

      if (method === 'POST') {
        (options.headers as any)['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}/${endpoint}`, options);

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TBO API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('TBO_REQUEST_TIMEOUT');
      }
      throw error;
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; baseUrl: string } {
    return {
      configured: this.isConfigured,
      baseUrl: this.baseUrl,
    };
  }

  /**
   * Search for available hotels
   * Timeout: 5-23 seconds recommended
   */
  async search(params: TBOSearchRequest): Promise<TBOSearchResponse> {
    const request = {
      ...params,
      ResponseTime: params.ResponseTime || 23,
      IsDetailedResponse: params.IsDetailedResponse ?? false,
      Filters: params.Filters || { Refundable: false, NoOfRooms: 0, MealType: 'All' },
    };
    return this.request<TBOSearchResponse>('Search', request, 25000);
  }

  /**
   * Pre-book to get up-to-date prices and policies
   * Timeout: 23 seconds recommended
   */
  async preBook(params: TBOPreBookRequest): Promise<TBOPreBookResponse> {
    const request = {
      ...params,
      PaymentMode: params.PaymentMode || 'Limit',
    };
    return this.request<TBOPreBookResponse>('PreBook', request, 25000);
  }

  /**
   * Confirm booking
   * Timeout: 120 seconds recommended
   */
  async book(params: TBOBookRequest): Promise<TBOBookResponse> {
    return this.request<TBOBookResponse>('Book', params, 130000);
  }

  /**
   * Cancel a booking
   */
  async cancel(params: TBOCancelRequest): Promise<TBOCancelResponse> {
    return this.request<TBOCancelResponse>('Cancel', params, 30000);
  }

  /**
   * Get booking details
   */
  async getBookingDetail(params: TBOBookingDetailRequest): Promise<TBOBookingDetailResponse> {
    return this.request<TBOBookingDetailResponse>('BookingDetail', params, 30000);
  }

  /**
   * Get list of countries (GET request)
   */
  async getCountryList(): Promise<TBOCountryListResponse> {
    return this.request<TBOCountryListResponse>('CountryList', null, 30000, 'GET');
  }

  /**
   * Get cities for a country (POST request with CountryCode)
   */
  async getCityList(params: TBOCityListRequest): Promise<TBOCityListResponse> {
    return this.request<TBOCityListResponse>('CityList', params, 30000, 'POST');
  }

  /**
   * Get hotel codes for a city (POST request)
   */
  async getHotelCodeList(params: TBOHotelCodeListRequest): Promise<any> {
    return this.request<any>('HotelCodeList', params, 30000, 'POST');
  }

  /**
   * Get TBO hotel codes for a city (newer endpoint, POST request)
   */
  async getTBOHotelCodeList(params: TBOHotelCodeListRequest): Promise<any> {
    return this.request<any>('TBOHotelCodeList', params, 30000, 'POST');
  }

  /**
   * Get hotel details (POST request)
   */
  async getHotelDetails(params: TBOHotelDetailsRequest): Promise<TBOHotelDetailsResponse> {
    return this.request<TBOHotelDetailsResponse>('HotelDetails', params, 30000, 'POST');
  }
}

// Singleton instance
export const tboClient = new TBOHolidaysClient();
