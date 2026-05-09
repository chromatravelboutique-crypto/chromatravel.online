import type { BedBankHotel, BedBankProvider, BedBankSearchParams } from "./types";
import { HotelbedsProvider } from "./hotelbeds";
import { tboProvider } from "./providers/tbo-provider";
import { ratehawkProvider } from "./providers/ratehawk-provider";
import { findDestinationMapping, getProviderCode } from "./destination-mapping";

export interface UnifiedSearchRequest {
  checkIn: string;
  checkOut: string;
  destination: string;
  rooms: Array<{
    adults: number;
    children: number;
    childrenAges?: number[];
  }>;
  currency?: string;
  nationality?: string;
}

export interface UnifiedProviderRate {
  provider: string;
  rateKey: string;
  price: number;
  originalPrice?: number;
  roomName: string;
  mealPlan?: string;
  refundable: boolean;
  cancellationPolicy?: string;
}

export interface UnifiedHotel {
  id: string;
  name: string;
  normalizedName: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  starRating: number;
  images: string[];
  thumbnail?: string;
  amenities: string[];
  lowestPrice: number;
  currency: string;
  providers: UnifiedProviderRate[];
  providerCodes: Record<string, string>;
}

export interface UnifiedSearchResponse {
  success: boolean;
  hotels: UnifiedHotel[];
  total: number;
  searchTime: number;
  providersQueried: string[];
  providersConfigured: string[];
  errors: Record<string, string>;
  destination: {
    name: string;
    country: string;
    found: boolean;
  };
}

const providers: BedBankProvider[] = [
  tboProvider,
  new HotelbedsProvider(),
  ratehawkProvider,
];

function normalizeHotelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(hotel|resort|suites?|spa|beach|boutique|luxury)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function calculateDistance(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function areHotelsSame(hotel1: BedBankHotel, hotel2: BedBankHotel): boolean {
  const name1 = normalizeHotelName(hotel1.name);
  const name2 = normalizeHotelName(hotel2.name);

  if (name1 === name2 && hotel1.starRating === hotel2.starRating) {
    return true;
  }

  const distance = calculateDistance(
    hotel1.latitude,
    hotel1.longitude,
    hotel2.latitude,
    hotel2.longitude
  );

  if (distance !== null && distance < 0.1) {
    const nameSimilarity = name1.includes(name2) || name2.includes(name1);
    if (nameSimilarity) return true;
  }

  return false;
}

function getBestRate(hotel: BedBankHotel): UnifiedProviderRate | null {
  let bestRate: UnifiedProviderRate | null = null;

  for (const room of hotel.rooms) {
    for (const rate of room.rates) {
      if (!bestRate || rate.price < bestRate.price) {
        bestRate = {
          provider: hotel.providerId,
          rateKey: rate.rateKey,
          price: rate.price,
          originalPrice: rate.originalPrice,
          roomName: room.name,
          mealPlan: rate.mealPlan || rate.boardName,
          refundable: rate.refundable,
          cancellationPolicy: rate.cancellationPolicy,
        };
      }
    }
  }

  return bestRate;
}

function mergeHotels(allHotels: BedBankHotel[]): UnifiedHotel[] {
  const merged: UnifiedHotel[] = [];
  const processed = new Set<string>();

  for (const hotel of allHotels) {
    if (processed.has(hotel.id)) continue;

    const normalizedName = normalizeHotelName(hotel.name);
    const matchingHotels = allHotels.filter(
      (h) => !processed.has(h.id) && areHotelsSame(hotel, h)
    );

    const allProviders: UnifiedProviderRate[] = [];
    const providerCodes: Record<string, string> = {};
    let lowestPrice = Infinity;

    for (const matchedHotel of matchingHotels) {
      processed.add(matchedHotel.id);
      const rate = getBestRate(matchedHotel);
      if (rate) {
        allProviders.push(rate);
        if (rate.price < lowestPrice) {
          lowestPrice = rate.price;
        }
      }
      providerCodes[matchedHotel.providerId] = matchedHotel.providerCode;
    }

    if (allProviders.length > 0) {
      allProviders.sort((a, b) => a.price - b.price);

      merged.push({
        id: hotel.id,
        name: hotel.name,
        normalizedName,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        starRating: hotel.starRating,
        images: hotel.images,
        thumbnail: hotel.thumbnail,
        amenities: hotel.amenities,
        lowestPrice: lowestPrice === Infinity ? 0 : lowestPrice,
        currency: hotel.currency,
        providers: allProviders,
        providerCodes,
      });
    }
  }

  return merged.sort((a, b) => a.lowestPrice - b.lowestPrice);
}

export async function unifiedHotelSearch(
  request: UnifiedSearchRequest
): Promise<UnifiedSearchResponse> {
  const startTime = Date.now();
  const errors: Record<string, string> = {};
  const providersQueried: string[] = [];
  const allHotels: BedBankHotel[] = [];

  const mapping = findDestinationMapping(request.destination);
  const destinationInfo = mapping
    ? { name: mapping.displayName, country: mapping.country, found: true }
    : { name: request.destination, country: "", found: false };

  const configuredProviders = providers.filter((p) => p.isConfigured());
  const providersConfigured = configuredProviders.map((p) => p.name);

  const totalGuests = request.rooms.reduce(
    (sum, r) => sum + r.adults + r.children,
    0
  );

  const searchPromises = configuredProviders.map(async (provider) => {
    const providerName = provider.name.toLowerCase() as "tbo" | "hotelbeds" | "ratehawk";
    const destinationCode = mapping
      ? getProviderCode(mapping, providerName)
      : request.destination;

    if (!destinationCode) {
      errors[provider.name] = `No destination mapping for ${request.destination}`;
      console.log(`[Unified Search] ${provider.name}: No destination code available`);
      return;
    }

    providersQueried.push(provider.name);

    const searchParams: BedBankSearchParams = {
      destination: destinationCode,
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      guests: totalGuests,
      rooms: request.rooms.length,
      nationality: request.nationality || "MX",
      currency: request.currency || "USD",
    };

    try {
      const hotels = await provider.searchHotels(searchParams);
      if (hotels.length > 0) {
        allHotels.push(...hotels);
      }
      console.log(`[Unified Search] ${provider.name}: ${hotels.length} hotels found`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors[provider.name] = message;
      console.error(`[Unified Search] ${provider.name} error:`, message);
    }
  });

  const results = await Promise.allSettled(searchPromises);
  
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const providerName = configuredProviders[index]?.name || `Provider ${index}`;
      errors[providerName] = result.reason?.message || "Promise rejected";
    }
  });

  const mergedHotels = mergeHotels(allHotels);

  return {
    success: mergedHotels.length > 0 || Object.keys(errors).length === 0,
    hotels: mergedHotels,
    total: mergedHotels.length,
    searchTime: Date.now() - startTime,
    providersQueried,
    providersConfigured,
    errors,
    destination: destinationInfo,
  };
}

export function getConfiguredProviders(): string[] {
  return providers.filter((p) => p.isConfigured()).map((p) => p.name);
}

export function getProviderStatus(): Array<{
  name: string;
  configured: boolean;
}> {
  return providers.map((p) => ({
    name: p.name,
    configured: p.isConfigured(),
  }));
}
