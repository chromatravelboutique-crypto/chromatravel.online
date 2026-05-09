import { useEffect } from "react";
import { useBrand } from "@/lib/brand-context";

interface ArticleSchemaProps {
  title: string;
  description: string;
  image?: string;
  author: string;
  publishedAt: string;
  slug: string;
  keywords?: string[];
}

export function ArticleSchema({ 
  title, 
  description, 
  image, 
  author, 
  publishedAt, 
  slug,
  keywords 
}: ArticleSchemaProps) {
  const { brand } = useBrand();

  useEffect(() => {
    const baseUrl = brand?.domain ? `https://${brand.domain}` : window.location.origin;
    const brandName = brand?.name || "Chroma Travel";
    const brandLogo = brand?.logoUrl ? `${baseUrl}${brand.logoUrl}` : `${baseUrl}/favicon.svg`;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": image || `${baseUrl}/og-default.jpg`,
      "author": {
        "@type": "Person",
        "name": author
      },
      "publisher": {
        "@type": "Organization",
        "name": brandName,
        "logo": {
          "@type": "ImageObject",
          "url": brandLogo
        }
      },
      "datePublished": publishedAt,
      "dateModified": publishedAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${baseUrl}/blog/${slug}`
      },
      "keywords": keywords?.join(", ") || ""
    };

    let script = document.querySelector('script[data-schema="article"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-schema", "article");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.querySelector('script[data-schema="article"]');
      if (existing) {
        existing.remove();
      }
    };
  }, [title, description, image, author, publishedAt, slug, keywords, brand]);

  return null;
}

interface TravelAgencySchemaProps {
  name?: string;
  description?: string;
}

export function TravelAgencySchema({ name, description }: TravelAgencySchemaProps = {}) {
  const { brand } = useBrand();

  useEffect(() => {
    const baseUrl = brand?.domain ? `https://${brand.domain}` : window.location.origin;
    const brandName = name || brand?.name || "Chroma Travel";
    const brandDescription = description || brand?.seoDescription || "Agencia de viajes especializada";

    const schema = {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      "name": brandName,
      "description": brandDescription,
      "url": baseUrl,
      "logo": brand?.logoUrl ? `${baseUrl}${brand.logoUrl}` : undefined,
      "telephone": brand?.phone,
      "email": brand?.email,
      "sameAs": [
        brand?.facebookUrl,
        brand?.instagramUrl,
        brand?.twitterUrl
      ].filter(Boolean),
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/buscar?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    let script = document.querySelector('script[data-schema="travel-agency"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-schema", "travel-agency");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.querySelector('script[data-schema="travel-agency"]');
      if (existing) {
        existing.remove();
      }
    };
  }, [name, description, brand]);

  return null;
}
