export interface AttractionSearchParams {
  destination: string;
  date?: string;
  category?: string;
  language?: string;
  currency?: string;
}

export interface Attraction {
  id: string;
  providerId: string;
  providerCode: string;
  name: string;
  description: string;
  shortDescription?: string;
  location: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  category: string;
  duration?: string;
  images: string[];
  thumbnail?: string;
  minPrice: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  highlights?: string[];
  included?: string[];
  excluded?: string[];
  options: AttractionOption[];
}

export interface AttractionOption {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  availability?: AttractionAvailability[];
}

export interface AttractionAvailability {
  date: string;
  times: string[];
  available: boolean;
}

export interface AttractionBookingParams {
  attractionId: string;
  optionId: string;
  date: string;
  time?: string;
  participants: {
    type: "adult" | "child" | "infant";
    count: number;
  }[];
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  specialRequests?: string;
}

export interface AttractionBookingResult {
  success: boolean;
  bookingId?: string;
  confirmationCode?: string;
  voucherUrl?: string;
  status?: string;
  errorMessage?: string;
}

export interface AttractionProvider {
  name: string;
  isConfigured(): boolean;
  searchAttractions(params: AttractionSearchParams): Promise<Attraction[]>;
  getAttractionDetails(attractionId: string): Promise<Attraction | null>;
  getAvailability(attractionId: string, optionId: string, date: string): Promise<AttractionAvailability | null>;
  createBooking(params: AttractionBookingParams): Promise<AttractionBookingResult>;
  cancelBooking(bookingId: string): Promise<boolean>;
}
