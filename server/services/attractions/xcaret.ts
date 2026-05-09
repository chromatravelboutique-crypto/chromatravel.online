import type {
  AttractionProvider,
  AttractionSearchParams,
  Attraction,
  AttractionAvailability,
  AttractionBookingParams,
  AttractionBookingResult,
} from "./types";

const API_BASE = "https://api.xcaret.com/v1";

export class XcaretProvider implements AttractionProvider {
  name = "Xcaret";
  private apiKey: string | null;
  private partnerId: string | null;

  constructor() {
    this.apiKey = process.env.XCARET_API_KEY || null;
    this.partnerId = process.env.XCARET_PARTNER_ID || null;
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.partnerId);
  }

  private getHeaders(): Record<string, string> {
    if (!this.apiKey) {
      throw new Error("Xcaret not configured");
    }
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "X-Partner-ID": this.partnerId || "",
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async searchAttractions(params: AttractionSearchParams): Promise<Attraction[]> {
    if (!this.isConfigured()) {
      console.log("[Xcaret] Not configured, returning mock parks");
      return this.getMockParks();
    }

    try {
      const queryParams = new URLSearchParams({
        destination: params.destination,
        ...(params.date && { date: params.date }),
        ...(params.language && { lang: params.language }),
        ...(params.currency && { currency: params.currency }),
      });

      const response = await fetch(`${API_BASE}/parks?${queryParams}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error("[Xcaret] Search failed:", response.status);
        return this.getMockParks();
      }

      const data = await response.json();
      return this.mapParksResponse(data);
    } catch (error) {
      console.error("[Xcaret] Search error:", error);
      return this.getMockParks();
    }
  }

  async getAttractionDetails(attractionId: string): Promise<Attraction | null> {
    if (!this.isConfigured()) {
      const parks = this.getMockParks();
      return parks.find((p) => p.id === attractionId) || null;
    }

    try {
      const response = await fetch(`${API_BASE}/parks/${attractionId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const attractions = this.mapParksResponse({ parks: [data] });
      return attractions[0] || null;
    } catch (error) {
      console.error("[Xcaret] Details error:", error);
      return null;
    }
  }

  async getAvailability(
    attractionId: string,
    optionId: string,
    date: string
  ): Promise<AttractionAvailability | null> {
    if (!this.isConfigured()) {
      return {
        date,
        times: ["09:00", "10:00", "11:00"],
        available: true,
      };
    }

    try {
      const response = await fetch(
        `${API_BASE}/parks/${attractionId}/availability?option=${optionId}&date=${date}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return {
        date: data.date,
        times: data.times || [],
        available: data.available ?? true,
      };
    } catch (error) {
      console.error("[Xcaret] Availability error:", error);
      return null;
    }
  }

  async createBooking(params: AttractionBookingParams): Promise<AttractionBookingResult> {
    if (!this.isConfigured()) {
      return {
        success: true,
        bookingId: `MOCK-${Date.now()}`,
        confirmationCode: `XC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: "confirmed",
      };
    }

    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          parkId: params.attractionId,
          optionId: params.optionId,
          date: params.date,
          time: params.time,
          participants: params.participants,
          contact: params.contactInfo,
          notes: params.specialRequests,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, errorMessage: error.message || "Booking failed" };
      }

      const data = await response.json();
      return {
        success: true,
        bookingId: data.bookingId,
        confirmationCode: data.confirmationCode,
        voucherUrl: data.voucherUrl,
        status: data.status,
      };
    } catch (error) {
      console.error("[Xcaret] Booking error:", error);
      return { success: false, errorMessage: "Booking request failed" };
    }
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    if (!this.isConfigured()) return true;

    try {
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error("[Xcaret] Cancel error:", error);
      return false;
    }
  }

  private getMockParks(): Attraction[] {
    return [
      {
        id: "xcaret",
        providerId: "xcaret",
        providerCode: "XCARET",
        name: "Xcaret Park",
        description: "Xcaret is a world-famous eco-archaeological park where you can enjoy over 50 natural and cultural attractions. Swim in underground rivers, snorkel in a coral reef aquarium, discover a jaguar island, visit a butterfly pavilion, and experience authentic Mexican culture through spectacular night shows.",
        shortDescription: "Mexico's premier eco-archaeological park with underground rivers, wildlife, and cultural shows.",
        location: "Carretera Chetumal-Puerto Juarez Km 282",
        city: "Riviera Maya",
        country: "Mexico",
        latitude: 20.5806,
        longitude: -87.1183,
        category: "Theme Park",
        duration: "Full Day (8-10 hours)",
        images: [
          "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800",
          "https://images.unsplash.com/photo-1552751753-0fc84ae5b6c8?w=800",
        ],
        thumbnail: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=400",
        minPrice: 139,
        currency: "USD",
        rating: 4.8,
        reviewCount: 15420,
        highlights: [
          "Underground rivers",
          "Snorkeling in coral reef",
          "Mexican folklore show",
          "Wildlife encounters",
          "Archaeological sites",
        ],
        included: [
          "Park entrance",
          "Buffet lunch",
          "Use of facilities",
          "Life jackets and snorkel equipment",
          "Night show",
        ],
        excluded: ["Transportation", "Photos", "Spa services", "Premium activities"],
        options: [
          {
            id: "basic",
            name: "Xcaret Basic",
            description: "Full day access to all natural attractions",
            duration: "Full Day",
            price: 139,
            currency: "USD",
          },
          {
            id: "plus",
            name: "Xcaret Plus",
            description: "Includes buffet lunch and premium areas",
            duration: "Full Day",
            price: 169,
            originalPrice: 189,
            currency: "USD",
          },
          {
            id: "total",
            name: "Xcaret Total",
            description: "All-inclusive with transportation and special activities",
            duration: "Full Day",
            price: 219,
            currency: "USD",
          },
        ],
      },
      {
        id: "xel-ha",
        providerId: "xcaret",
        providerCode: "XELHA",
        name: "Xel-Ha All Inclusive",
        description: "Xel-Ha is a natural aquatic park and the world's largest natural aquarium. Enjoy unlimited snorkeling, all-inclusive food and beverages, jungle trails, and water activities in crystal-clear waters.",
        shortDescription: "World's largest natural aquarium with all-inclusive snorkeling paradise.",
        location: "Carretera Chetumal Puerto Juarez Km 240",
        city: "Riviera Maya",
        country: "Mexico",
        latitude: 20.3186,
        longitude: -87.3600,
        category: "Water Park",
        duration: "Full Day (6-8 hours)",
        images: [
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
        ],
        thumbnail: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",
        minPrice: 129,
        currency: "USD",
        rating: 4.7,
        reviewCount: 12350,
        highlights: [
          "Unlimited snorkeling",
          "All-inclusive food & drinks",
          "Zip lines over water",
          "Cliff jumping",
          "Jungle bike trails",
        ],
        included: [
          "All-inclusive access",
          "Buffet and beverages",
          "Snorkel equipment",
          "Lockers and towels",
        ],
        excluded: ["Transportation", "Photos", "Spa services"],
        options: [
          {
            id: "all-inclusive",
            name: "Xel-Ha All Inclusive",
            description: "Complete experience with unlimited food and drinks",
            duration: "Full Day",
            price: 129,
            currency: "USD",
          },
        ],
      },
      {
        id: "xplor",
        providerId: "xcaret",
        providerCode: "XPLOR",
        name: "Xplor Adventure Park",
        description: "Xplor is the ultimate adventure park featuring the highest zip-lines in Cancun, amphibious vehicles through jungle trails, underground river rafting, and swimming in stalactite caves.",
        shortDescription: "Extreme adventure park with zip-lines, ATVs, and underground rivers.",
        location: "Carretera Chetumal-Puerto Juarez Km 282",
        city: "Riviera Maya",
        country: "Mexico",
        latitude: 20.5815,
        longitude: -87.1167,
        category: "Adventure Park",
        duration: "Full Day (5-7 hours)",
        images: [
          "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
        ],
        thumbnail: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400",
        minPrice: 159,
        currency: "USD",
        rating: 4.9,
        reviewCount: 8920,
        highlights: [
          "14 zip-lines (highest in the area)",
          "Amphibious vehicles",
          "Underground rafting",
          "Stalactite river swimming",
          "Unlimited buffet",
        ],
        included: ["Park entrance", "All activities", "Buffet lunch", "Equipment"],
        excluded: ["Transportation", "Photos", "Souvenirs"],
        options: [
          {
            id: "day",
            name: "Xplor Day",
            description: "Daytime adventure experience",
            duration: "Full Day",
            price: 159,
            currency: "USD",
          },
          {
            id: "fuego",
            name: "Xplor Fuego (Night)",
            description: "Evening adventure under torchlight",
            duration: "Evening",
            price: 139,
            currency: "USD",
          },
        ],
      },
    ];
  }

  private mapParksResponse(data: any): Attraction[] {
    if (!data.parks) return [];

    return data.parks.map((park: any) => ({
      id: park.id,
      providerId: "xcaret",
      providerCode: park.code,
      name: park.name,
      description: park.description || "",
      shortDescription: park.shortDescription,
      location: park.address || "",
      city: park.city || "Riviera Maya",
      country: park.country || "Mexico",
      latitude: park.latitude,
      longitude: park.longitude,
      category: park.category || "Theme Park",
      duration: park.duration,
      images: park.images || [],
      thumbnail: park.thumbnail,
      minPrice: park.minPrice || 0,
      currency: park.currency || "USD",
      rating: park.rating,
      reviewCount: park.reviewCount,
      highlights: park.highlights || [],
      included: park.included || [],
      excluded: park.excluded || [],
      options: park.options?.map((opt: any) => ({
        id: opt.id,
        name: opt.name,
        description: opt.description,
        duration: opt.duration,
        price: opt.price,
        originalPrice: opt.originalPrice,
        currency: opt.currency || "USD",
      })) || [],
    }));
  }
}

export const xcaretProvider = new XcaretProvider();
