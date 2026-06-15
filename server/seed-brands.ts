import { db } from "./db";
import { brands, users } from "@shared/schema";
import { hash } from "bcrypt";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const initialBrands = [
  {
    code: "chroma",
    name: "Chroma Travel",
    domain: "chromatravel.online",
    tagline: "Viaja con libertad",
    description: "Agencia de viajes especializada en experiencias LGBT+ seguras e inclusivas",
    
    // SEO
    seoTitle: "Chroma Travel | Agencia de Viajes LGBT+ en México",
    seoDescription: "Experiencias de viaje exclusivas y seguras para la comunidad LGBT+. Hoteles verificados, destinos inclusivos y asesoría personalizada. Tu agencia de viajes de confianza.",
    seoKeywords: ["viajes lgbt", "agencia de viajes gay", "hoteles gay friendly", "destinos lgbt mexico", "vacaciones lgbt", "turismo gay"],
    ogImage: "/assets/chroma-og-image.jpg",
    twitterHandle: "@chromatravelonline",
    
    // Theme
    primaryColor: "#10b981",
    secondaryColor: "#ec4899",
    accentColor: "#f59e0b",
    logoUrl: "/assets/kuani-chroma.png",
    faviconUrl: "/favicon.ico",
    
    // Contact
    whatsappNumber: "+524434044104",
    whatsappMessage: "Hola! Me interesa planear mi viaje con Chroma Travel",
    email: "contacto@chromatravel.online",
    phone: "+52 55 1234 5678",
    address: "Ciudad de México, México",
    facebookUrl: "https://facebook.com/chromatravelonline",
    instagramUrl: "https://instagram.com/chromatravelonline",
    twitterUrl: "https://twitter.com/chromatravelonline",
    youtubeUrl: null,
    
    // Analytics
    googleAnalyticsId: null,
    googleAdsenseId: "ca-pub-9377043040912794",
    facebookPixelId: null,
    amazonAffiliateId: null,
    
    // UTM
    utmSource: "chroma",
    utmMedium: "organic",
    utmCampaign: "chroma-2024",
    
    // Social
    metricoolApiKey: null,
    zapierWebhookUrl: null,
    socialHashtags: ["#ChromaTravel", "#ViajesLGBT", "#TurismoInclusivo", "#GayFriendly", "#Pride"],
    socialTemplates: {
      facebook: "{{title}} - {{excerpt}} #ViajesLGBT #ChromaTravel",
      instagram: "{{title}}\n\n{{excerpt}}\n\n{{hashtags}}",
      twitter: "{{title}} {{link}} #ViajesLGBT"
    },
    
    // Schema.org
    schemaOrgType: "TravelAgency",
    schemaOrgData: {
      "@type": "TravelAgency",
      "name": "Chroma Travel",
      "description": "Agencia de viajes especializada en experiencias LGBT+ seguras e inclusivas",
      "url": "https://chromatravel.online",
      "logo": "https://chromatravel.online/assets/kueani-logo.png",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "MX",
        "addressLocality": "Ciudad de México"
      },
      "sameAs": [
        "https://facebook.com/chromatravelonline",
        "https://instagram.com/chromatravelonline",
        "https://twitter.com/chromatravelonline"
      ]
    },
    
    lgbtFocused: true,
    premiumBrand: false,
    active: true,
  },
  {
    code: "fenix",
    name: "Fenix Traveler",
    domain: "fenixtraveler.com",
    tagline: "Viajes Premium, Experiencias Únicas",
    description: "Agencia de viajes premium especializada en experiencias de lujo y destinos exclusivos",
    
    // SEO
    seoTitle: "Fenix Traveler | Agencia de Viajes Premium en México",
    seoDescription: "Viajes de lujo y experiencias exclusivas. Hoteles 5 estrellas, tours privados y servicio personalizado. Tu agencia de viajes premium de confianza.",
    seoKeywords: ["viajes de lujo", "agencia de viajes premium", "hoteles 5 estrellas", "tours privados", "viajes exclusivos", "vacaciones de lujo"],
    ogImage: "/assets/fenix-og-image.jpg",
    twitterHandle: "@fenixtraveler",
    
    // Theme
    primaryColor: "#b45309",
    secondaryColor: "#0f172a",
    accentColor: "#eab308",
    logoUrl: "/assets/kuani-fenix.png",
    faviconUrl: "/favicon-fenix.ico",
    
    // Contact
    whatsappNumber: "+524435049568",
    whatsappMessage: "Hola! Me interesa planear mi viaje premium con Fenix Traveler",
    email: "contacto@fenixtraveler.com",
    phone: "+52 55 9876 5432",
    address: "Ciudad de México, México",
    facebookUrl: "https://facebook.com/fenixtraveler",
    instagramUrl: "https://instagram.com/fenixtraveler",
    twitterUrl: "https://twitter.com/fenixtraveler",
    youtubeUrl: "https://youtube.com/fenixtraveler",
    
    // Analytics
    googleAnalyticsId: null,
    googleAdsenseId: "ca-pub-9377043040912794",
    facebookPixelId: null,
    amazonAffiliateId: "fenixtra-20",
    
    // UTM
    utmSource: "fenix",
    utmMedium: "organic",
    utmCampaign: "fenix-2024",
    
    // Social
    metricoolApiKey: null,
    zapierWebhookUrl: null,
    socialHashtags: ["#FenixTraveler", "#ViajesPremium", "#LujoMexicano", "#TravelLuxury", "#ExperienciasÚnicas"],
    socialTemplates: {
      facebook: "{{title}} - {{excerpt}} #ViajesPremium #FenixTraveler",
      instagram: "{{title}}\n\n{{excerpt}}\n\n{{hashtags}}",
      twitter: "{{title}} {{link}} #ViajesPremium"
    },
    
    // Schema.org
    schemaOrgType: "TravelAgency",
    schemaOrgData: {
      "@type": "TravelAgency",
      "name": "Fenix Traveler",
      "description": "Agencia de viajes premium especializada en experiencias de lujo y destinos exclusivos",
      "url": "https://fenixtraveler.com",
      "logo": "https://fenixtraveler.com/assets/fenix-logo.png",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "MX",
        "addressLocality": "Ciudad de México"
      },
      "sameAs": [
        "https://facebook.com/fenixtraveler",
        "https://instagram.com/fenixtraveler",
        "https://twitter.com/fenixtraveler",
        "https://youtube.com/fenixtraveler"
      ]
    },
    
    lgbtFocused: false,
    premiumBrand: true,
    active: true,
  }
];

export async function seedBrands() {
  console.log("Seeding brands...");
  
  if (!db) {
    console.log("Database not available, skipping brand seeding");
    return;
  }
  
  for (const brandData of initialBrands) {
    try {
      // Check if brand already exists
      const { eq } = await import("drizzle-orm");
      const existing = await db.select().from(brands).where(eq(brands.code, brandData.code));
      
      if (existing.length === 0) {
        await db.insert(brands).values(brandData as any);
        console.log(`Created brand: ${brandData.code}`);
      } else {
        await db
          .update(brands)
          .set({
            whatsappNumber: brandData.whatsappNumber,
            logoUrl: brandData.logoUrl,
            email: brandData.email,
            phone: brandData.phone,
          })
          .where(eq(brands.code, brandData.code));
        console.log(`Updated brand ${brandData.code} contact data`);
      }
    } catch (error) {
      console.error(`Error seeding brand ${brandData.code}:`, error);
    }
  }
  
  console.log("Brand seeding complete");
  
  // Seed admin users for each brand
  await seedAdminUsers();
}

async function seedAdminUsers() {
  console.log("Seeding admin users...");
  
  if (!db) {
    console.log("Database not available, skipping admin seeding");
    return;
  }
  
  const adminUsers = [
    {
      email: "contacto@chromatravel.online",
      brandCode: "chroma",
      firstName: "Admin",
      lastName: "Chroma",
    },
    {
      email: "eric.cervantes@fenixtraveler.com",
      brandCode: "fenix",
      firstName: "Admin",
      lastName: "Fenix",
    }
  ];
  
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Fenix2026!";
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("[seed-brands] ADMIN_PASSWORD not set — using default password 'Fenix2026!'");
  } else {
    console.log("[seed-brands] Using ADMIN_PASSWORD from environment");
  }
  const hashedPassword = await hash(adminPassword, 10);
  
  for (const adminData of adminUsers) {
    try {
      // Check if admin already exists
      const existing = await db.select().from(users).where(eq(users.email, adminData.email));
      
      if (existing.length === 0) {
        // Get brand ID
        const brand = await db.select().from(brands).where(eq(brands.code, adminData.brandCode));
        const brandId = brand[0]?.id || null;
        
        await db.insert(users).values({
          email: adminData.email,
          password: hashedPassword,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          role: "admin",
          brandId: brandId,
          language: "es",
          currency: "MXN",
        });
        console.log(`Created admin: ${adminData.email}`);
      } else {
        // Update password if admin exists (ensures password is always current)
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.email, adminData.email));
        console.log(`Updated admin password: ${adminData.email}`);
      }
    } catch (error) {
      console.error(`Error seeding admin ${adminData.email}:`, error);
    }
  }
  
  console.log("Admin seeding complete");
}
