export interface BedBankSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  nationality?: string;
  currency?: string;
}

export interface BedBankHotel {
  id: string;
  providerId: string;
  providerCode: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  starRating: number;
  images: string[];
  thumbnail?: string;
  amenities: string[];
  minPrice: number;
  currency: string;
  rooms: BedBankRoom[];
}

export interface BedBankRoom {
  id: string;
  name: string;
  description?: string;
  maxOccupancy: number;
  bedType?: string;
  amenities: string[];
  images: string[];
  rates: BedBankRate[];
}

export interface BedBankRate {
  id: string;
  rateKey: string;
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  mealPlan?: string;
  cancellationPolicy?: string;
  refundable: boolean;
  boardName?: string;
}

export interface BedBankBookingParams {
  rateKey: string;
  hotelId: string;
  checkIn: string;
  checkOut: string;
  guests: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }[];
  specialRequests?: string;
}

export interface BedBankBookingResult {
  success: boolean;
  bookingId?: string;
  confirmationCode?: string;
  status?: string;
  errorMessage?: string;
}

export interface BedBankProvider {
  name: string;
  isConfigured(): boolean;
  searchHotels(params: BedBankSearchParams): Promise<BedBankHotel[]>;
  getHotelDetails(hotelId: string, params: BedBankSearchParams): Promise<BedBankHotel | null>;
  checkRate(rateKey: string): Promise<BedBankRate | null>;
  createBooking(params: BedBankBookingParams): Promise<BedBankBookingResult>;
  cancelBooking(bookingId: string): Promise<boolean>;
}
