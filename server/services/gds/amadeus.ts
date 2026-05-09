import type {
  GDSProvider,
  FlightSearchParams,
  Flight,
  FlightSegment,
  FlightBookingParams,
  FlightBookingResult,
} from "./types";

const API_BASE = "https://api.amadeus.com/v2";
const AUTH_URL = "https://api.amadeus.com/v1/security/oauth2/token";

export class AmadeusProvider implements GDSProvider {
  name = "Amadeus";
  private clientId: string | null;
  private clientSecret: string | null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.AMADEUS_CLIENT_ID || null;
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET || null;
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error("Amadeus not configured");
    }

    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate with Amadeus");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken!;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    if (!this.isConfigured()) {
      console.log("[Amadeus] Not configured, returning mock flights");
      return this.getMockFlights(params);
    }

    try {
      const queryParams = new URLSearchParams({
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        adults: params.passengers.adults.toString(),
        currencyCode: params.currency || "USD",
        max: "20",
      });

      if (params.returnDate) {
        queryParams.set("returnDate", params.returnDate);
      }
      if (params.passengers.children) {
        queryParams.set("children", params.passengers.children.toString());
      }
      if (params.passengers.infants) {
        queryParams.set("infants", params.passengers.infants.toString());
      }
      if (params.cabinClass) {
        queryParams.set("travelClass", params.cabinClass.toUpperCase());
      }
      if (params.directOnly) {
        queryParams.set("nonStop", "true");
      }

      const response = await fetch(
        `${API_BASE}/shopping/flight-offers?${queryParams}`,
        {
          method: "GET",
          headers: await this.getHeaders(),
        }
      );

      if (!response.ok) {
        console.error("[Amadeus] Search failed:", response.status);
        return this.getMockFlights(params);
      }

      const data = await response.json();
      return this.mapFlightsResponse(data);
    } catch (error) {
      console.error("[Amadeus] Search error:", error);
      return this.getMockFlights(params);
    }
  }

  async getFlightDetails(flightId: string): Promise<Flight | null> {
    return null;
  }

  async priceCheck(flightId: string): Promise<{ available: boolean; price: number; currency: string } | null> {
    if (!this.isConfigured()) {
      return { available: true, price: 450, currency: "USD" };
    }

    return null;
  }

  async createBooking(params: FlightBookingParams): Promise<FlightBookingResult> {
    if (!this.isConfigured()) {
      return {
        success: true,
        bookingId: `MOCK-${Date.now()}`,
        pnr: `${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: "confirmed",
      };
    }

    try {
      const response = await fetch(`${API_BASE}/booking/flight-orders`, {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({
          data: {
            type: "flight-order",
            flightOffers: [{ id: params.flightId }],
            travelers: params.passengers.map((p, i) => ({
              id: (i + 1).toString(),
              dateOfBirth: p.dateOfBirth,
              name: {
                firstName: p.firstName,
                lastName: p.lastName,
              },
              documents: p.passportNumber
                ? [
                    {
                      documentType: "PASSPORT",
                      number: p.passportNumber,
                      expiryDate: p.passportExpiry,
                      issuanceCountry: p.nationality,
                      nationality: p.nationality,
                      holder: true,
                    },
                  ]
                : undefined,
              contact: {
                emailAddress: p.email || params.contactEmail,
                phones: [
                  {
                    deviceType: "MOBILE",
                    number: p.phone || params.contactPhone,
                  },
                ],
              },
            })),
            remarks: params.specialRequests
              ? { general: [{ subType: "GENERAL_MISCELLANEOUS", text: params.specialRequests }] }
              : undefined,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, errorMessage: error.errors?.[0]?.detail || "Booking failed" };
      }

      const data = await response.json();
      return {
        success: true,
        bookingId: data.data?.id,
        pnr: data.data?.associatedRecords?.[0]?.reference,
        ticketNumbers: data.data?.ticketingAgreement?.option === "DELAY_TO_QUEUE" ? [] : undefined,
        status: "confirmed",
      };
    } catch (error) {
      console.error("[Amadeus] Booking error:", error);
      return { success: false, errorMessage: "Booking request failed" };
    }
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    if (!this.isConfigured()) return true;

    try {
      const response = await fetch(`${API_BASE}/booking/flight-orders/${bookingId}`, {
        method: "DELETE",
        headers: await this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error("[Amadeus] Cancel error:", error);
      return false;
    }
  }

  private getMockFlights(params: FlightSearchParams): Flight[] {
    const airlines = [
      { code: "AM", name: "Aeromexico", logo: "aeromexico" },
      { code: "VB", name: "VivaAerobus", logo: "vivaaerobus" },
      { code: "Y4", name: "Volaris", logo: "volaris" },
      { code: "UA", name: "United Airlines", logo: "united" },
      { code: "AA", name: "American Airlines", logo: "american" },
    ];

    const flights: Flight[] = [];

    for (let i = 0; i < 5; i++) {
      const airline = airlines[i % airlines.length];
      const basePrice = 250 + Math.floor(Math.random() * 400);
      const departureHour = 6 + (i * 3);
      const flightDuration = 2 + Math.floor(Math.random() * 3);

      flights.push({
        id: `${airline.code}${100 + i}`,
        providerId: "amadeus",
        providerCode: `${airline.code}${100 + i}`,
        price: basePrice,
        currency: params.currency || "USD",
        outbound: [
          {
            id: `${airline.code}${100 + i}-out`,
            airline: airline.code,
            airlineName: airline.name,
            flightNumber: `${airline.code}${100 + i}`,
            origin: params.origin,
            destination: params.destination,
            departureTime: `${params.departureDate}T${departureHour.toString().padStart(2, "0")}:00:00`,
            arrivalTime: `${params.departureDate}T${(departureHour + flightDuration).toString().padStart(2, "0")}:30:00`,
            duration: `PT${flightDuration}H30M`,
            cabinClass: params.cabinClass || "economy",
          },
        ],
        inbound: params.returnDate
          ? [
              {
                id: `${airline.code}${200 + i}-in`,
                airline: airline.code,
                airlineName: airline.name,
                flightNumber: `${airline.code}${200 + i}`,
                origin: params.destination,
                destination: params.origin,
                departureTime: `${params.returnDate}T${(departureHour + 2).toString().padStart(2, "0")}:00:00`,
                arrivalTime: `${params.returnDate}T${(departureHour + 2 + flightDuration).toString().padStart(2, "0")}:30:00`,
                duration: `PT${flightDuration}H30M`,
                cabinClass: params.cabinClass || "economy",
              },
            ]
          : undefined,
        baggageAllowance: {
          carryOn: "1 personal item + 1 carry-on",
          checked: i < 2 ? "1 bag (23kg)" : "Not included",
        },
        refundable: i < 2,
        seatsRemaining: 3 + Math.floor(Math.random() * 10),
      });
    }

    return flights.sort((a, b) => a.price - b.price);
  }

  private mapFlightsResponse(data: any): Flight[] {
    if (!data.data) return [];

    return data.data.map((offer: any) => {
      const price = parseFloat(offer.price?.total || "0");

      const outboundItinerary = offer.itineraries?.[0];
      const inboundItinerary = offer.itineraries?.[1];

      const mapSegments = (itinerary: any): FlightSegment[] => {
        if (!itinerary?.segments) return [];

        return itinerary.segments.map((seg: any, idx: number) => ({
          id: `${offer.id}-${idx}`,
          airline: seg.carrierCode,
          flightNumber: `${seg.carrierCode}${seg.number}`,
          aircraft: seg.aircraft?.code,
          origin: seg.departure?.iataCode,
          destination: seg.arrival?.iataCode,
          departureTime: seg.departure?.at,
          arrivalTime: seg.arrival?.at,
          duration: seg.duration,
          cabinClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[idx]?.cabin || "ECONOMY",
        }));
      };

      return {
        id: offer.id,
        providerId: "amadeus",
        providerCode: offer.id,
        price,
        currency: offer.price?.currency || "USD",
        outbound: mapSegments(outboundItinerary),
        inbound: inboundItinerary ? mapSegments(inboundItinerary) : undefined,
        refundable: offer.pricingOptions?.refundableFare ?? false,
        seatsRemaining: offer.numberOfBookableSeats,
      };
    });
  }
}

export const amadeusProvider = new AmadeusProvider();
