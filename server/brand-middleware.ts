import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { brands, type Brand } from "@shared/schema";
import { eq } from "drizzle-orm";

// Brand context that gets attached to the request
export interface BrandContext {
  id: string;
  code: string;
  name: string;
  domain: string;
  tagline: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
  ogImage: string | null;
  twitterHandle: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
  email: string | null;
  phone: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  googleAnalyticsId: string | null;
  googleAdsenseId: string | null;
  amazonAffiliateId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  socialHashtags: string[] | null;
  schemaOrgType: string | null;
  schemaOrgData: unknown;
  lgbtFocused: boolean | null;
  premiumBrand: boolean | null;
}

declare global {
  namespace Express {
    interface Request {
      brand?: BrandContext;
    }
  }
}

// Map of domain patterns to brand codes
const domainMappings: Record<string, string> = {
  "chromatravel.online": "chroma",
  "www.chromatravel.online": "chroma",
  "fenixtraveler.com": "fenix",
  "www.fenixtraveler.com": "fenix",
  // Development domains
  "localhost": "chroma",
};

// Cache for brand data (avoids DB hit on every request)
let brandCache: Map<string, BrandContext> = new Map();
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Default brand contexts for when database is unavailable
function getDefaultBrandContext(code: string): BrandContext {
  const defaults: Record<string, BrandContext> = {
    chroma: {
      id: "default-chroma",
      code: "chroma",
      name: "Chroma Travel",
      domain: "chromatravel.online",
      tagline: "Viaja con libertad",
      description: "Agencia de viajes especializada en experiencias LGBT+ seguras e inclusivas",
      seoTitle: "Chroma Travel | Agencia de Viajes LGBT+ en México",
      seoDescription: "Experiencias de viaje exclusivas y seguras para la comunidad LGBT+.",
      seoKeywords: ["viajes lgbt", "agencia de viajes gay"],
      ogImage: "/assets/chroma-og-image.jpg",
      twitterHandle: "@chromatravelonline",
      primaryColor: "#10b981",
      secondaryColor: "#ec4899",
      accentColor: "#f59e0b",
      logoUrl: "/assets/kueani-logo.png",
      faviconUrl: "/favicon.ico",
      whatsappNumber: "+524434044104",
      whatsappMessage: "Hola! Me interesa planear mi viaje con Chroma Travel",
      email: "hola@chromatravel.online",
      phone: "+52 55 1234 5678",
      facebookUrl: "https://facebook.com/chromatravelonline",
      instagramUrl: "https://instagram.com/chromatravelonline",
      twitterUrl: "https://twitter.com/chromatravelonline",
      youtubeUrl: null,
      googleAnalyticsId: null,
      googleAdsenseId: "ca-pub-9377043040912794",
      amazonAffiliateId: null,
      utmSource: "chroma",
      utmMedium: "organic",
      utmCampaign: "chroma-2024",
      socialHashtags: ["#ChromaTravel", "#ViajesLGBT"],
      schemaOrgType: "TravelAgency",
      schemaOrgData: {},
      lgbtFocused: true,
      premiumBrand: false,
    },
    fenix: {
      id: "default-fenix",
      code: "fenix",
      name: "Fenix Traveler",
      domain: "fenixtraveler.com",
      tagline: "Viajes Premium, Experiencias Únicas",
      description: "Agencia de viajes premium especializada en experiencias de lujo",
      seoTitle: "Fenix Traveler | Agencia de Viajes Premium en México",
      seoDescription: "Viajes de lujo y experiencias exclusivas.",
      seoKeywords: ["viajes de lujo", "agencia de viajes premium"],
      ogImage: "/assets/fenix-og-image.jpg",
      twitterHandle: "@fenixtraveler",
      primaryColor: "#b45309",
      secondaryColor: "#0f172a",
      accentColor: "#eab308",
      logoUrl: "/assets/fenix-logo.png",
      faviconUrl: "/favicon-fenix.ico",
      whatsappNumber: "+524435049568",
      whatsappMessage: "Hola! Me interesa planear mi viaje premium con Fenix Traveler",
      email: "contacto@fenixtraveler.com",
      phone: "+52 55 9876 5432",
      facebookUrl: "https://facebook.com/fenixtraveler",
      instagramUrl: "https://instagram.com/fenixtraveler",
      twitterUrl: "https://twitter.com/fenixtraveler",
      youtubeUrl: "https://youtube.com/fenixtraveler",
      googleAnalyticsId: null,
      googleAdsenseId: "ca-pub-9377043040912794",
      amazonAffiliateId: "fenixtra-20",
      utmSource: "fenix",
      utmMedium: "organic",
      utmCampaign: "fenix-2024",
      socialHashtags: ["#FenixTraveler", "#ViajesPremium"],
      schemaOrgType: "TravelAgency",
      schemaOrgData: {},
      lgbtFocused: false,
      premiumBrand: true,
    },
  };
  return defaults[code] || defaults.chroma;
}

async function getBrandByCode(code: string): Promise<BrandContext | null> {
  const now = Date.now();
  
  // Check cache
  if (now < cacheExpiry && brandCache.has(code)) {
    return brandCache.get(code)!;
  }
  
  // Fetch from database with error handling for missing table
  let result;
  try {
    if (!db) {
      return getDefaultBrandContext(code);
    }
    result = await db.select().from(brands).where(eq(brands.code, code)).limit(1);
  } catch (error: any) {
    // If table doesn't exist or db is unavailable, return default brand context
    console.error("Database query error:", error.message);
    return getDefaultBrandContext(code);
  }
  
  if (result.length === 0) {
    return getDefaultBrandContext(code);
  }
  
  const brand = result[0];
  const context: BrandContext = {
    id: brand.id,
    code: brand.code,
    name: brand.name,
    domain: brand.domain,
    tagline: brand.tagline,
    description: brand.description,
    seoTitle: brand.seoTitle,
    seoDescription: brand.seoDescription,
    seoKeywords: brand.seoKeywords,
    ogImage: brand.ogImage,
    twitterHandle: brand.twitterHandle,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
    logoUrl: brand.logoUrl,
    faviconUrl: brand.faviconUrl,
    whatsappNumber: brand.whatsappNumber,
    whatsappMessage: brand.whatsappMessage,
    email: brand.email,
    phone: brand.phone,
    facebookUrl: brand.facebookUrl,
    instagramUrl: brand.instagramUrl,
    twitterUrl: brand.twitterUrl,
    youtubeUrl: brand.youtubeUrl,
    googleAnalyticsId: brand.googleAnalyticsId,
    googleAdsenseId: brand.googleAdsenseId,
    amazonAffiliateId: brand.amazonAffiliateId,
    utmSource: brand.utmSource,
    utmMedium: brand.utmMedium,
    utmCampaign: brand.utmCampaign,
    socialHashtags: brand.socialHashtags,
    schemaOrgType: brand.schemaOrgType,
    schemaOrgData: brand.schemaOrgData,
    lgbtFocused: brand.lgbtFocused,
    premiumBrand: brand.premiumBrand,
  };
  
  // Update cache
  brandCache.set(code, context);
  cacheExpiry = now + CACHE_TTL;
  
  return context;
}

export function getBrandCodeFromHost(host: string): string {
  // Remove port if present
  const hostname = host.split(":")[0].toLowerCase();
  
  // Check exact match first
  if (domainMappings[hostname]) {
    return domainMappings[hostname];
  }
  
  // Check if it's a Replit domain (for development)
  if (hostname.includes("replit") || hostname.includes("repl.co")) {
    return "chroma"; // Default to chroma for development
  }
  
  // Default to chroma
  return "chroma";
}

export async function brandMiddleware(req: Request, res: Response, next: NextFunction) {
  const host = req.get("host") || "localhost";
  const brandCode = getBrandCodeFromHost(host);
  
  try {
    const brand = await getBrandByCode(brandCode);
    req.brand = brand || getDefaultBrandContext(brandCode);
  } catch (error) {
    console.error("Brand middleware error, using default:", error);
    // Always provide a brand context even on error
    req.brand = getDefaultBrandContext(brandCode);
  }
  
  next();
}

// Utility to invalidate brand cache
export function invalidateBrandCache() {
  brandCache.clear();
  cacheExpiry = 0;
}

// Get all brands (for admin)
export async function getAllBrands(): Promise<Brand[]> {
  if (!db) {
    return [];
  }
  try {
    return await db.select().from(brands).where(eq(brands.active, true));
  } catch (error) {
    console.error("Failed to get brands:", error);
    return [];
  }
}
