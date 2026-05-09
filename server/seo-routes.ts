import type { Express, Request, Response } from "express";
import { db } from "./db";
import { destinations, blogPosts, hotels, brands } from "@shared/schema";
import { eq, and, or, isNull } from "drizzle-orm";

function getDatabase() {
  if (!db) {
    throw new Error("Database not available");
  }
  return db;
}

// Generate sitemap.xml dynamically based on brand
export function generateSitemap(baseUrl: string, pages: Array<{ url: string; lastmod?: string; changefreq?: string; priority?: number }>) {
  const urlEntries = pages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq || 'weekly'}</changefreq>
    <priority>${page.priority || 0.5}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}

// Generate robots.txt based on brand - Optimized for Google AdSense
export function generateRobotsTxt(baseUrl: string, brandCode: string) {
  return `# Robots.txt for ${brandCode}
# Optimized for SEO and Google AdSense

User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Google AdSense and Ads verification
User-agent: Mediapartners-Google
Allow: /

User-agent: AdsBot-Google
Allow: /

User-agent: Googlebot
Allow: /

# Disallow admin, API, and private routes
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /account/
Disallow: /_/
Disallow: /login
Disallow: /register

# Allow search engines to crawl important public sections
Allow: /hotels
Allow: /destinations
Allow: /blog/
Allow: /experiences
Allow: /about
Allow: /contact
Allow: /ofertas
Allow: /privacy-policy
Allow: /terms-and-conditions
Allow: /cookie-policy
Allow: /lgbt
Allow: /pride

# Crawl delay for respectful crawling
Crawl-delay: 1
`;
}

// Generate Schema.org TravelAgency JSON-LD
export function generateTravelAgencySchema(brand: any) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": brand.name,
    "description": brand.seoDescription || brand.description,
    "url": `https://${brand.domain}`,
    "logo": brand.logoUrl ? `https://${brand.domain}${brand.logoUrl}` : undefined,
    "telephone": brand.phone,
    "email": brand.email,
    "address": brand.address ? {
      "@type": "PostalAddress",
      "addressLocality": brand.address,
      "addressCountry": "MX"
    } : undefined,
    "sameAs": [
      brand.facebookUrl,
      brand.instagramUrl,
      brand.twitterUrl,
      brand.youtubeUrl
    ].filter(Boolean),
    "potentialAction": {
      "@type": "SearchAction",
      "target": `https://${brand.domain}/buscar?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return schema;
}

// Generate Article Schema for blog posts
export function generateArticleSchema(post: any, brand: any, authorName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.seoTitle || post.title,
    "description": post.seoDescription || post.excerpt,
    "image": post.featuredImageWebp || post.image,
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": brand.name,
      "logo": {
        "@type": "ImageObject",
        "url": brand.logoUrl ? `https://${brand.domain}${brand.logoUrl}` : undefined
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://${brand.domain}/blog/${post.slug}`
    }
  };
}

export function registerSeoRoutes(app: Express) {
  // Sitemap.xml endpoint
  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).send("Brand not found");
      }

      const baseUrl = `https://${brand.domain}`;
      const pages: Array<{ url: string; lastmod?: string; changefreq?: string; priority?: number }> = [];

      // Static pages - Core content
      pages.push({ url: "/", priority: 1.0, changefreq: "daily" });
      pages.push({ url: "/hotels", priority: 0.9, changefreq: "daily" });
      pages.push({ url: "/destinations", priority: 0.9, changefreq: "weekly" });
      pages.push({ url: "/experiences", priority: 0.85, changefreq: "weekly" });
      pages.push({ url: "/blog", priority: 0.8, changefreq: "daily" });
      pages.push({ url: "/lgbt", priority: 0.85, changefreq: "weekly" });
      pages.push({ url: "/contact", priority: 0.7, changefreq: "monthly" });
      pages.push({ url: "/about", priority: 0.7, changefreq: "monthly" });
      
      pages.push({ url: "/ofertas", priority: 0.9, changefreq: "daily" });

      // Legal pages - Required for AdSense
      pages.push({ url: "/privacy-policy", priority: 0.5, changefreq: "monthly" });
      pages.push({ url: "/terms-and-conditions", priority: 0.5, changefreq: "monthly" });
      pages.push({ url: "/cookie-policy", priority: 0.5, changefreq: "monthly" });

      // Brand-scoped filter: include items that belong to this brand or have no brand (shared)
      const destinationFilter = or(
        eq(destinations.brandId, brand.id),
        isNull(destinations.brandId)
      );
      
      const blogFilter = and(
        eq(blogPosts.published, true),
        or(
          eq(blogPosts.brandId, brand.id),
          isNull(blogPosts.brandId)
        )
      );
      
      const hotelFilter = and(
        eq(hotels.active, true),
        or(
          eq(hotels.brandId, brand.id),
          isNull(hotels.brandId)
        )
      );

      // Destinations (brand-scoped)
      const allDestinations = await getDatabase().select().from(destinations).where(destinationFilter);
      for (const dest of allDestinations) {
        if (dest.slug) {
          pages.push({
            url: `/destinos/${dest.slug}`,
            priority: 0.8,
            changefreq: "weekly"
          });
        }
      }

      // Blog posts from Markdown (primary source)
      try {
        const { getMarkdownPosts } = await import("./markdown-blog");
        const mdPosts = getMarkdownPosts(brand.code);
        for (const post of mdPosts) {
          pages.push({
            url: `/blog/${post.slug}`,
            lastmod: new Date(post.publishedAt).toISOString().split('T')[0],
            priority: 0.7,
            changefreq: "weekly"
          });
        }
      } catch (mdError) {
        console.log("Markdown posts not available for sitemap, trying database");
      }

      // Blog posts from database
      try {
        const allPosts = await getDatabase().select().from(blogPosts).where(blogFilter);
        for (const post of allPosts) {
          const existingUrl = pages.find(p => p.url === `/blog/${post.slug}`);
          if (!existingUrl) {
            pages.push({
              url: `/blog/${post.slug}`,
              lastmod: post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : undefined,
              priority: 0.7,
              changefreq: "monthly"
            });
          }
        }
      } catch (dbError) {
        console.log("Database posts not available for sitemap");
      }

      // Blog posts from static JSON (additional content)
      try {
        const { getStaticBlogPosts } = await import("./static-blog");
        const staticPosts = getStaticBlogPosts(brand.code);
        for (const post of staticPosts) {
          const existingUrl = pages.find(p => p.url === `/blog/${post.slug}`);
          if (!existingUrl) {
            pages.push({
              url: `/blog/${post.slug}`,
              priority: 0.65,
              changefreq: "monthly"
            });
          }
        }
      } catch (staticError) {
        console.log("Static posts not available for sitemap");
      }

      // Hotels (brand-scoped)
      const allHotels = await getDatabase().select().from(hotels).where(hotelFilter);
      for (const hotel of allHotels) {
        pages.push({
          url: `/hoteles/${hotel.id}`,
          priority: 0.8,
          changefreq: "weekly"
        });
      }

      const sitemap = generateSitemap(baseUrl, pages);
      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt endpoint
  app.get("/robots.txt", (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).send("Brand not found");
      }

      const baseUrl = `https://${brand.domain}`;
      const robotsTxt = generateRobotsTxt(baseUrl, brand.code);
      
      res.set("Content-Type", "text/plain");
      res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      res.send(robotsTxt);
    } catch (error) {
      console.error("Error generating robots.txt:", error);
      res.status(500).send("Error generating robots.txt");
    }
  });

  // Ads.txt endpoint for Google AdSense verification
  app.get("/ads.txt", (req: Request, res: Response) => {
    const adsTxt = `google.com, pub-9377043040912794, DIRECT, f08c47fec0942fa0`;
    res.set("Content-Type", "text/plain");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(adsTxt);
  });

  // Schema.org endpoint for TravelAgency
  app.get("/api/schema/travel-agency", (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const schema = generateTravelAgencySchema(brand);
      res.json(schema);
    } catch (error) {
      console.error("Error generating schema:", error);
      res.status(500).json({ message: "Error generating schema" });
    }
  });

  // API endpoint to get SEO meta tags for a page
  app.get("/api/seo/:page", async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { page } = req.params;
      const baseUrl = `https://${brand.domain}`;

      let meta = {
        title: brand.seoTitle || brand.name,
        description: brand.seoDescription || brand.description,
        keywords: brand.seoKeywords?.join(", ") || "",
        ogTitle: brand.seoTitle || brand.name,
        ogDescription: brand.seoDescription || brand.description,
        ogImage: brand.ogImage ? `${baseUrl}${brand.ogImage}` : null,
        ogUrl: baseUrl,
        twitterCard: "summary_large_image",
        twitterSite: brand.twitterHandle,
        canonicalUrl: baseUrl,
      };

      // Customize based on page type
      if (page === "home") {
        // Use defaults
      } else if (page === "destinos") {
        meta.title = `Destinos ${brand.lgbtFocused ? "LGBT+ Friendly" : "Premium"} | ${brand.name}`;
        meta.description = `Descubre los mejores destinos ${brand.lgbtFocused ? "gay-friendly" : "de lujo"} con ${brand.name}. Hoteles verificados y experiencias únicas.`;
        meta.canonicalUrl = `${baseUrl}/destinos`;
      } else if (page === "hoteles") {
        meta.title = `Hoteles ${brand.lgbtFocused ? "Gay-Friendly" : "5 Estrellas"} | ${brand.name}`;
        meta.description = `Encuentra los mejores hoteles ${brand.lgbtFocused ? "LGBT+ friendly" : "de lujo"} con ${brand.name}. Reserva con confianza.`;
        meta.canonicalUrl = `${baseUrl}/hoteles`;
      } else if (page === "blog") {
        meta.title = `Blog de Viajes | ${brand.name}`;
        meta.description = `Consejos, guías y experiencias de viaje ${brand.lgbtFocused ? "para la comunidad LGBT+" : "premium"}. Descubre nuevos destinos con ${brand.name}.`;
        meta.canonicalUrl = `${baseUrl}/blog`;
      } else if (page === "contacto") {
        meta.title = `Contacto | ${brand.name}`;
        meta.description = `¿Tienes preguntas? Contáctanos para planear tu próximo viaje ${brand.lgbtFocused ? "LGBT+ seguro" : "de lujo"} con ${brand.name}.`;
        meta.canonicalUrl = `${baseUrl}/contacto`;
      }

      res.json(meta);
    } catch (error) {
      console.error("Error fetching SEO meta:", error);
      res.status(500).json({ message: "Error fetching SEO meta" });
    }
  });
}
