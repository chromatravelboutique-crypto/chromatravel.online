export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  currency?: string;
  directOnly?: boolean;
}

export interface Flight {
  id: string;
  providerId: string;
  providerCode: string;
  price: number;
  currency: string;
  outbound: FlightSegment[];
  inbound?: FlightSegment[];
  baggageAllowance?: BaggageInfo;
  fareConditions?: string;
  refundable: boolean;
  seatsRemaining?: number;
}

export interface FlightSegment {
  id: string;
  airline: string;
  airlineName?: string;
  airlineLogo?: string;
  flightNumber: string;
  aircraft?: string;
  origin: string;
  originCity?: string;
  originAirport?: string;
  destination: string;
  destinationCity?: string;
  destinationAirport?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cabinClass: string;
  layoverDuration?: string;
}

export interface BaggageInfo {
  carryOn: string;
  checked: string;
}

export interface FlightBookingParams {
  flightId: string;
  passengers: {
    type: "adult" | "child" | "infant";
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    passportNumber?: string;
    passportExpiry?: string;
    nationality?: string;
    email?: string;
    phone?: string;
  }[];
  contactEmail: string;
  contactPhone: string;
  specialRequests?: string;
}

export interface FlightBookingResult {
  success: boolean;
  bookingId?: string;
  pnr?: string;
  ticketNumbers?: string[];
  status?: string;
  errorMessage?: string;
}

export interface GDSProvider {
  name: string;
  isConfigured(): boolean;
  searchFlights(params: FlightSearchParams): Promise<Flight[]>;
  getFlightDetails(flightId: string): Promise<Flight | null>;
  priceCheck(flightId: string): Promise<{ available: boolean; price: number; currency: string } | null>;
  createBooking(params: FlightBookingParams): Promise<FlightBookingResult>;
  cancelBooking(bookingId: string): Promise<boolean>;
}
