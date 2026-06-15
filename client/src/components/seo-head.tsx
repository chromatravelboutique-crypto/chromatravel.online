import { useEffect } from "react";
import { useBrand } from "@/lib/brand-context";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: "website" | "article" | "product";
  image?: string;
  keywords?: string[];
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
  };
  noindex?: boolean;
  appendBrand?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
}

export function SEOHead({ 
  title, 
  description, 
  canonical,
  type = "website",
  image,
  keywords,
  article,
  noindex = false,
  appendBrand = true
}: SEOHeadProps) {
  const { brand } = useBrand();

  useEffect(() => {
    const brandName = brand?.name || "Chroma Travel";
    const fullTitle = title 
      ? (appendBrand ? `${title} | ${brandName}` : title)
      : brand?.seoTitle || brandName;
    const metaDescription = description || brand?.seoDescription || "";
    const brandDomain = brand?.domain || "chromatravel.online";
    const ogImage = image || brand?.ogImage || "";
    const origin = `https://www.${brandDomain}`;
    const canonicalUrl = canonical
      ? (canonical.startsWith("http") ? canonical : `${origin}${canonical}`)
      : `${origin}${window.location.pathname}`;

    document.title = fullTitle;

    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta && content) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      if (meta && content) {
        meta.setAttribute("content", content);
      }
    };

    updateMeta("description", metaDescription);
    updateMeta("og:title", fullTitle, true);
    updateMeta("og:description", metaDescription, true);
    updateMeta("og:type", type === "article" ? "article" : "website", true);
    updateMeta("og:url", canonicalUrl, true);
    updateMeta("og:site_name", brandName, true);
    if (ogImage) updateMeta("og:image", ogImage, true);
    updateMeta("twitter:card", "summary_large_image", true);
    updateMeta("twitter:title", fullTitle, true);
    updateMeta("twitter:description", metaDescription, true);
    if (ogImage) updateMeta("twitter:image", ogImage, true);
    
    if (keywords && keywords.length > 0) {
      updateMeta("keywords", keywords.join(", "));
    }
    
    if (noindex) {
      updateMeta("robots", "noindex, nofollow");
    } else {
      updateMeta("robots", "index, follow, max-image-preview:large");
    }
    
    if (article) {
      if (article.publishedTime) {
        updateMeta("article:published_time", article.publishedTime, true);
      }
      if (article.modifiedTime) {
        updateMeta("article:modified_time", article.modifiedTime, true);
      }
      if (article.author) {
        updateMeta("article:author", article.author, true);
      }
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

  }, [title, description, canonical, type, image, brand, keywords, article, noindex]);

  return null;
}

export function OrganizationSchema() {
  const { brand, isChroma } = useBrand();
  
  useEffect(() => {
    const brandName = brand?.name || "Chroma Travel";
    const brandDomain = brand?.domain || "chromatravel.online";
    const brandEmail = brand?.email || (isChroma ? "contacto@chromatravel.online" : "info@fenixtraveler.com");
    
    const socialLinks = isChroma 
      ? [
          "https://www.facebook.com/chromatravelboutique",
          "https://www.instagram.com/chroma.travel.boutique/",
          "https://x.com/chromatravel",
          "https://www.youtube.com/@chromatravel"
        ]
      : [
          brand?.facebookUrl,
          brand?.instagramUrl,
          brand?.twitterUrl,
          brand?.youtubeUrl
        ].filter(Boolean);
    
    const serviceTypes = isChroma
      ? [
          "Viajes LGBT+",
          "Hoteles gay-friendly",
          "Paquetes de viaje premium",
          "Experiencias Pride",
          "Viajes de lujo inclusivos"
        ]
      : [
          "Viajes premium",
          "Hoteles 5 estrellas",
          "Paquetes de viaje exclusivos",
          "Experiencias VIP",
          "Viajes de lujo"
        ];
    
    const schema = {
      "@context": "https://schema.org",
      "@type": ["Organization", "TravelAgency"],
      "@id": `https://${brandDomain}/#organization`,
      name: brandName,
      alternateName: isChroma ? "Chroma Travel Boutique" : "Fenix Traveler Premium",
      description: brand?.seoDescription || (isChroma 
        ? "Agencia de viajes LGBT+ premium especializada en experiencias seguras e inclusivas"
        : "Agencia de viajes premium con experiencias exclusivas de lujo"),
      url: `https://${brandDomain}`,
      logo: {
        "@type": "ImageObject",
        url: `https://${brandDomain}/favicon-512.png`,
        width: 512,
        height: 512
      },
      image: `https://${brandDomain}/favicon-512.png`,
      email: brandEmail,
      address: {
        "@type": "PostalAddress",
        addressCountry: "MX",
        addressLocality: "Ciudad de México"
      },
      sameAs: socialLinks,
      slogan: isChroma 
        ? "Viaja con orgullo, viaja con Chroma" 
        : "Experiencias de viaje premium exclusivas",
      foundingDate: "2020",
      areaServed: {
        "@type": "GeoCircle",
        geoMidpoint: {
          "@type": "GeoCoordinates",
          latitude: 19.4326,
          longitude: -99.1332
        },
        geoRadius: "50000"
      },
      serviceType: serviceTypes,
      priceRange: "$$-$$$"
    };

    let existingScript = document.querySelector('script[data-schema="organization"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", "organization");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="organization"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [brand]);

  return null;
}

export function WebsiteSchema() {
  const { brand } = useBrand();
  
  useEffect(() => {
    const brandName = brand?.name || "Chroma Travel";
    const brandDomain = brand?.domain || "chromatravel.online";
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `https://${brandDomain}/#website`,
      name: brandName,
      url: `https://${brandDomain}`,
      description: brand?.seoDescription || "Tu agencia de viajes LGBT+ premium",
      publisher: {
        "@id": `https://${brandDomain}/#organization`
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `https://${brandDomain}/hotel-search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      inLanguage: "es-MX"
    };

    let existingScript = document.querySelector('script[data-schema="website"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", "website");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="website"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [brand]);

  return null;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export function FAQSchema({ items }: FAQSchemaProps) {
  useEffect(() => {
    if (!items || items.length === 0) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map(item => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    };

    let existingScript = document.querySelector('script[data-schema="faq"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", "faq");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="faq"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [items]);

  return null;
}

