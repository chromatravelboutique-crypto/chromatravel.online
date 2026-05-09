import type {
  BedBankProvider,
  BedBankSearchParams,
  BedBankHotel,
  BedBankRate,
  BedBankBookingParams,
  BedBankBookingResult,
} from "../types";

export class RateHawkProvider implements BedBankProvider {
  name = "RateHawk";
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.RATEHAWK_API_KEY || null;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async searchHotels(params: BedBankSearchParams): Promise<BedBankHotel[]> {
    if (!this.isConfigured()) {
      console.log("[RateHawk Provider] Not configured, skipping");
      return [];
    }

    console.log("[RateHawk Provider] Integration pending - returning empty results");
    return [];
  }

  async getHotelDetails(
    hotelId: string,
    params: BedBankSearchParams
  ): Promise<BedBankHotel | null> {
    return null;
  }

  async checkRate(rateKey: string): Promise<BedBankRate | null> {
    return null;
  }

  async createBooking(params: BedBankBookingParams): Promise<BedBankBookingResult> {
    return { success: false, errorMessage: "RateHawk integration pending" };
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    return false;
  }
}

export const ratehawkProvider = new RateHawkProvider();
