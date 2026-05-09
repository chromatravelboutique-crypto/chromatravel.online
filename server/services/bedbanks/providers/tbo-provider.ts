import type {
  BedBankProvider,
  BedBankSearchParams,
  BedBankHotel,
  BedBankRoom,
  BedBankRate,
  BedBankBookingParams,
  BedBankBookingResult,
} from "../types";
import { TBOService } from "../../tbo";

export class TBOProvider implements BedBankProvider {
  name = "TBO";
  private service: TBOService;

  constructor() {
    this.service = new TBOService(15);
  }

  isConfigured(): boolean {
    return this.service.isConfigured();
  }

  async searchHotels(params: BedBankSearchParams): Promise<BedBankHotel[]> {
    if (!this.isConfigured()) {
      console.log("[TBO Provider] Not configured, skipping");
      return [];
    }

    try {
      const numRooms = params.rooms || 1;
      const adultsPerRoom = Math.max(1, Math.ceil(params.guests / numRooms));
      
      const rooms = Array.from({ length: numRooms }, () => ({
        adults: adultsPerRoom,
        children: 0,
        childrenAges: [] as number[],
      }));

      if (!params.destination || params.destination.length < 2) {
        console.log("[TBO Provider] Invalid destination code:", params.destination);
        return [];
      }

      const result = await this.service.search({
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        cityCode: params.destination,
        nationality: params.nationality || "MX",
        rooms,
        maxResults: 50,
      });

      if (!result.success || !result.hotels) {
        const errorMsg = result.error || "No hotels found";
        console.log("[TBO Provider] Search failed:", errorMsg);
        throw new Error(errorMsg);
      }

      return result.hotels.map((hotel) => this.mapToUnified(hotel, params.currency || "USD"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown TBO error";
      console.error("[TBO Provider] Search error:", message);
      throw error;
    }
  }

  private mapToUnified(hotel: any, currency: string): BedBankHotel {
    const rooms: BedBankRoom[] = (hotel.rooms || []).map((room: any, idx: number) => ({
      id: `tbo-room-${hotel.hotelCode}-${idx}`,
      name: room.roomType || "Standard Room",
      description: room.inclusion,
      maxOccupancy: 2,
      amenities: room.amenities || [],
      images: [],
      rates: [
        {
          id: `tbo-rate-${hotel.hotelCode}-${idx}`,
          rateKey: room.bookingCode || "",
          name: room.ratePlan || "Standard",
          price: room.finalPrice,
          originalPrice: room.originalPrice,
          currency,
          mealPlan: room.ratePlan,
          refundable: room.isRefundable || false,
          cancellationPolicy: room.cancelPolicies?.[0]
            ? `Cancel before ${room.cancelPolicies[0].fromDate}`
            : undefined,
        },
      ],
    }));

    return {
      id: `tbo-${hotel.hotelCode}`,
      providerId: "tbo",
      providerCode: hotel.hotelCode,
      name: hotel.hotelName,
      description: "",
      address: hotel.address || "",
      city: "",
      country: "",
      latitude: hotel.latitude ? parseFloat(hotel.latitude) : undefined,
      longitude: hotel.longitude ? parseFloat(hotel.longitude) : undefined,
      starRating: hotel.starRating || 0,
      images: hotel.image ? [hotel.image] : [],
      thumbnail: hotel.image,
      amenities: [],
      minPrice: hotel.lowestPrice,
      currency,
      rooms,
    };
  }

  async getHotelDetails(
    hotelId: string,
    params: BedBankSearchParams
  ): Promise<BedBankHotel | null> {
    const hotelCode = hotelId.replace("tbo-", "");
    const hotels = await this.searchHotels({
      ...params,
      destination: hotelCode,
    });
    return hotels[0] || null;
  }

  async checkRate(rateKey: string): Promise<BedBankRate | null> {
    return null;
  }

  async createBooking(params: BedBankBookingParams): Promise<BedBankBookingResult> {
    return { success: false, errorMessage: "Use TBO direct booking" };
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    return false;
  }
}

export const tboProvider = new TBOProvider();
