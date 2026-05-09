import { hotelbedsProvider } from "./bedbanks/hotelbeds";
import { xcaretProvider } from "./attractions/xcaret";
import { amadeusProvider } from "./gds/amadeus";

import type { BedBankProvider, BedBankSearchParams, BedBankHotel } from "./bedbanks/types";
import type { AttractionProvider, AttractionSearchParams, Attraction } from "./attractions/types";
import type { GDSProvider, FlightSearchParams, Flight } from "./gds/types";

export const bedBankProviders: BedBankProvider[] = [hotelbedsProvider];
export const attractionProviders: AttractionProvider[] = [xcaretProvider];
export const gdsProviders: GDSProvider[] = [amadeusProvider];

export async function searchHotelsFromProviders(
  params: BedBankSearchParams
): Promise<BedBankHotel[]> {
  const results = await Promise.all(
    bedBankProviders.map((provider) =>
      provider.searchHotels(params).catch((err) => {
        console.error(`[${provider.name}] Search failed:`, err);
        return [];
      })
    )
  );
  return results.flat().sort((a, b) => a.minPrice - b.minPrice);
}

export async function searchAttractionsFromProviders(
  params: AttractionSearchParams
): Promise<Attraction[]> {
  const results = await Promise.all(
    attractionProviders.map((provider) =>
      provider.searchAttractions(params).catch((err) => {
        console.error(`[${provider.name}] Search failed:`, err);
        return [];
      })
    )
  );
  return results.flat().sort((a, b) => a.minPrice - b.minPrice);
}

export async function searchFlightsFromProviders(
  params: FlightSearchParams
): Promise<Flight[]> {
  const results = await Promise.all(
    gdsProviders.map((provider) =>
      provider.searchFlights(params).catch((err) => {
        console.error(`[${provider.name}] Search failed:`, err);
        return [];
      })
    )
  );
  return results.flat().sort((a, b) => a.price - b.price);
}

export function getProviderStatus() {
  return {
    bedBanks: bedBankProviders.map((p) => ({
      name: p.name,
      configured: p.isConfigured(),
    })),
    attractions: attractionProviders.map((p) => ({
      name: p.name,
      configured: p.isConfigured(),
    })),
    gds: gdsProviders.map((p) => ({
      name: p.name,
      configured: p.isConfigured(),
    })),
  };
}

export { hotelbedsProvider, xcaretProvider, amadeusProvider };
export * from "./bedbanks/types";
export * from "./attractions/types";
export * from "./gds/types";
