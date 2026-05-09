import { createHash } from "crypto";
import type {
  BedBankProvider,
  BedBankSearchParams,
  BedBankHotel,
  BedBankRate,
  BedBankBookingParams,
  BedBankBookingResult,
} from "./types";

const API_BASE = "https://api.hotelbeds.com/hotel-api/1.0";

function generateSignature(apiKey: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const toHash = apiKey + secret + timestamp;
  return createHash("sha256").update(toHash).digest("hex");
}

export class HotelbedsProvider implements BedBankProvider {
  name = "Hotelbeds";
  private apiKey: string | null;
  private apiSecret: string | null;

  constructor() {
    this.apiKey = process.env.HOTELBEDS_API_KEY || null;
    this.apiSecret = process.env.HOTELBEDS_SECRET || process.env.HOTELBEDS_API_SECRET || null;
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }

  private getHeaders(): Record<string, string> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("Hotelbeds not configured");
    }
    return {
      "Api-Key": this.apiKey,
      "X-Signature": generateSignature(this.apiKey, this.apiSecret),
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async searchHotels(params: BedBankSearchParams): Promise<BedBankHotel[]> {
    if (!this.isConfigured()) {
      console.log("[Hotelbeds] Not configured, returning mock hotels");
      return this.getMockHotels(params);
    }

    try {
      const response = await fetch(`${API_BASE}/hotels`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          stay: {
            checkIn: params.checkIn,
            checkOut: params.checkOut,
          },
          occupancies: [
            {
              rooms: params.rooms || 1,
              adults: params.guests,
              children: 0,
            },
          ],
          destination: {
            code: params.destination,
          },
        }),
      });

      if (!response.ok) {
        console.error("[Hotelbeds] Search failed:", response.status);
        return [];
      }

      const data = await response.json();
      return this.mapHotelsResponse(data);
    } catch (error) {
      console.error("[Hotelbeds] Search error:", error);
      return [];
    }
  }

  async getHotelDetails(
    hotelId: string,
    params: BedBankSearchParams
  ): Promise<BedBankHotel | null> {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(`${API_BASE}/hotels/${hotelId}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          stay: {
            checkIn: params.checkIn,
            checkOut: params.checkOut,
          },
          occupancies: [
            {
              rooms: params.rooms || 1,
              adults: params.guests,
              children: 0,
            },
          ],
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const hotels = this.mapHotelsResponse(data);
      return hotels[0] || null;
    } catch (error) {
      console.error("[Hotelbeds] Details error:", error);
      return null;
    }
  }

  async checkRate(rateKey: string): Promise<BedBankRate | null> {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(`${API_BASE}/checkrates`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ rooms: [{ rateKey }] }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const room = data.hotel?.rooms?.[0];
      const rate = room?.rates?.[0];

      if (!rate) return null;

      return {
        id: rate.rateKey,
        rateKey: rate.rateKey,
        name: room.name || "Standard Room",
        price: parseFloat(rate.net),
        currency: data.currency || "USD",
        mealPlan: rate.boardName,
        refundable: rate.rateType !== "NON_REFUNDABLE",
        cancellationPolicy: rate.cancellationPolicies?.[0]?.description,
      };
    } catch (error) {
      console.error("[Hotelbeds] Check rate error:", error);
      return null;
    }
  }

  async createBooking(
    params: BedBankBookingParams
  ): Promise<BedBankBookingResult> {
    if (!this.isConfigured()) {
      return { success: false, errorMessage: "Provider not configured" };
    }

    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          holder: {
            name: params.guests[0]?.firstName || "Guest",
            surname: params.guests[0]?.lastName || "Guest",
          },
          rooms: [
            {
              rateKey: params.rateKey,
              paxes: params.guests.map((g, i) => ({
                roomId: 1,
                type: "AD",
                name: g.firstName,
                surname: g.lastName,
              })),
            },
          ],
          clientReference: `CT-${Date.now()}`,
          remark: params.specialRequests,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, errorMessage: error.error?.message || "Booking failed" };
      }

      const data = await response.json();
      return {
        success: true,
        bookingId: data.booking?.reference,
        confirmationCode: data.booking?.reference,
        status: data.booking?.status,
      };
    } catch (error) {
      console.error("[Hotelbeds] Booking error:", error);
      return { success: false, errorMessage: "Booking request failed" };
    }
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error("[Hotelbeds] Cancel error:", error);
      return false;
    }
  }

  private getMockHotels(params: BedBankSearchParams): BedBankHotel[] {
    const mockHotels: BedBankHotel[] = [
      {
        id: "mock-hotel-1",
        providerId: "hotelbeds",
        providerCode: "MOCK001",
        name: "Grand Fiesta Americana Coral Beach",
        description: "Resort de lujo frente al mar con vistas espectaculares al Mar Caribe. Habitaciones elegantes, spa de clase mundial y múltiples restaurantes gourmet.",
        address: "Boulevard Kukulcán Km 9.5",
        city: params.destination || "Cancún",
        country: "Mexico",
        latitude: 21.1344,
        longitude: -86.7475,
        starRating: 5,
        images: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800"],
        thumbnail: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400",
        amenities: ["Spa", "Pool", "Beach Access", "WiFi", "Restaurant", "Gym"],
        minPrice: 280,
        currency: params.currency || "USD",
        rooms: [
          {
            id: "room-1",
            name: "Deluxe Ocean View",
            maxOccupancy: 2,
            amenities: ["King Bed", "Ocean View", "Mini Bar"],
            images: [],
            rates: [
              {
                id: "rate-1",
                rateKey: "mock-rate-1",
                name: "Best Available Rate",
                price: 280,
                currency: params.currency || "USD",
                mealPlan: "Room Only",
                refundable: true,
              },
            ],
          },
        ],
      },
      {
        id: "mock-hotel-2",
        providerId: "hotelbeds",
        providerCode: "MOCK002",
        name: "Secrets The Vine Cancun",
        description: "Resort solo para adultos con concepto all-inclusive de lujo. Perfecto para parejas que buscan romance y tranquilidad.",
        address: "Boulevard Kukulcán Km 14.5",
        city: params.destination || "Cancún",
        country: "Mexico",
        latitude: 21.0865,
        longitude: -86.7715,
        starRating: 5,
        images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"],
        thumbnail: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",
        amenities: ["Adults Only", "All-Inclusive", "Spa", "Pool", "Beach"],
        minPrice: 450,
        currency: params.currency || "USD",
        rooms: [
          {
            id: "room-2",
            name: "Preferred Club Junior Suite",
            maxOccupancy: 2,
            amenities: ["King Bed", "Jacuzzi", "Butler Service"],
            images: [],
            rates: [
              {
                id: "rate-2",
                rateKey: "mock-rate-2",
                name: "All-Inclusive",
                price: 450,
                currency: params.currency || "USD",
                mealPlan: "All Inclusive",
                refundable: false,
              },
            ],
          },
        ],
      },
      {
        id: "mock-hotel-3",
        providerId: "hotelbeds",
        providerCode: "MOCK003",
        name: "Hyatt Ziva Cancun",
        description: "Resort all-inclusive familiar con actividades para todas las edades, múltiples piscinas y acceso a playa privada.",
        address: "Boulevard Kukulcán Km 8.5",
        city: params.destination || "Cancún",
        country: "Mexico",
        latitude: 21.1435,
        longitude: -86.7490,
        starRating: 4,
        images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"],
        thumbnail: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",
        amenities: ["Family Friendly", "All-Inclusive", "Kids Club", "Pool", "Beach"],
        minPrice: 320,
        currency: params.currency || "USD",
        rooms: [
          {
            id: "room-3",
            name: "Ocean View Room",
            maxOccupancy: 4,
            amenities: ["Two Double Beds", "Balcony", "Ocean View"],
            images: [],
            rates: [
              {
                id: "rate-3",
                rateKey: "mock-rate-3",
                name: "All-Inclusive Family",
                price: 320,
                currency: params.currency || "USD",
                mealPlan: "All Inclusive",
                refundable: true,
              },
            ],
          },
        ],
      },
    ];

    return mockHotels;
  }

  private mapHotelsResponse(data: any): BedBankHotel[] {
    if (!data.hotels?.hotels) return [];

    return data.hotels.hotels.map((hotel: any) => {
      const rooms = hotel.rooms?.map((room: any) => ({
        id: room.code,
        name: room.name,
        maxOccupancy: room.maxAdults || 2,
        amenities: [],
        images: [],
        rates: room.rates?.map((rate: any) => ({
          id: rate.rateKey,
          rateKey: rate.rateKey,
          name: rate.boardName || "Room Only",
          price: parseFloat(rate.net),
          currency: data.currency || "USD",
          mealPlan: rate.boardName,
          refundable: rate.rateType !== "NON_REFUNDABLE",
        })) || [],
      })) || [];

      const minPrice = Math.min(
        ...rooms.flatMap((r: any) => r.rates.map((rate: any) => rate.price)).filter((p: number) => p > 0),
        Infinity
      );

      return {
        id: hotel.code,
        providerId: "hotelbeds",
        providerCode: hotel.code,
        name: hotel.name,
        description: hotel.description?.content || "",
        address: hotel.address?.content || "",
        city: hotel.destinationName || "",
        country: hotel.countryCode || "",
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        starRating: hotel.categoryCode ? parseInt(hotel.categoryCode.replace(/\D/g, "")) : 3,
        images: hotel.images?.map((img: any) => `https://photos.hotelbeds.com/giata/medium/${img.path}`) || [],
        thumbnail: hotel.images?.[0] ? `https://photos.hotelbeds.com/giata/small/${hotel.images[0].path}` : undefined,
        amenities: hotel.facilities?.map((f: any) => f.description) || [],
        minPrice: minPrice === Infinity ? 0 : minPrice,
        currency: data.currency || "USD",
        rooms,
      };
    });
  }
}

export const hotelbedsProvider = new HotelbedsProvider();
