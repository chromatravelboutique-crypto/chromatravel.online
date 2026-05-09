import { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Brand } from "@shared/schema";

interface BrandContextType {
  brand: Brand | null;
  isLoading: boolean;
  isChroma: boolean;
  isFenix: boolean;
}

const BrandContext = createContext<BrandContextType>({
  brand: null,
  isLoading: true,
  isChroma: true,
  isFenix: false,
});

export function useBrand() {
  return useContext(BrandContext);
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { data: brand, isLoading } = useQuery<Brand>({
    queryKey: ["/api/brand"],
  });

  const isChroma = brand?.code === "chroma" || !brand;
  const isFenix = brand?.code === "fenix";

  useEffect(() => {
    if (brand) {
      document.documentElement.setAttribute("data-brand", brand.code);
      
      if (brand.seoTitle) {
        document.title = brand.seoTitle;
      }

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && brand.seoDescription) {
        metaDescription.setAttribute("content", brand.seoDescription);
      }

      if (brand.primaryColor) {
        document.documentElement.style.setProperty("--brand-primary", brand.primaryColor);
      }
      if (brand.secondaryColor) {
        document.documentElement.style.setProperty("--brand-secondary", brand.secondaryColor);
      }
      if (brand.accentColor) {
        document.documentElement.style.setProperty("--brand-accent", brand.accentColor);
      }
    }
  }, [brand]);

  return (
    <BrandContext.Provider value={{ brand: brand || null, isLoading, isChroma, isFenix }}>
      {children}
    </BrandContext.Provider>
  );
}
