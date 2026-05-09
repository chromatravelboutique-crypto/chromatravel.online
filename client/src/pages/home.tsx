import { HeroSection } from "@/components/hero-section";
import { TarifasEspecialesSection } from "@/components/tarifas-especiales-section";
import { DestinationsSection } from "@/components/destinations-section";
import { FeaturesSection } from "@/components/features-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { CTASection } from "@/components/cta-section";
import { RntTrustSection } from "@/components/rnt-trust-section";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { SEOHead, OrganizationSchema, WebsiteSchema } from "@/components/seo-head";
import { useBrand } from "@/lib/brand-context";

export default function Home() {
  const { brand, isChroma } = useBrand();
  
  const seoTitle = isChroma 
    ? "Viajes LGBT+ de Lujo | Hoteles Gay-Friendly y Experiencias Pride" 
    : "Viajes Premium Exclusivos | Hoteles de Lujo y Experiencias VIP";
  
  const seoDescription = isChroma
    ? "Agencia de viajes LGBT+ premium en México. Descubre hoteles gay-friendly verificados, cruceros exclusivos, paquetes Pride y experiencias únicas para la comunidad. Viaja seguro con Chroma Travel."
    : "Experiencias de viaje premium con atención personalizada. Hoteles 5 estrellas, destinos exclusivos y servicio de primera clase con Fenix Traveler.";

  const seoKeywords = isChroma
    ? [
        "viajes LGBT+",
        "viajes gay friendly",
        "hoteles gay friendly",
        "turismo LGBT México",
        "agencia viajes LGBT",
        "luxury gay travel",
        "viajes LGBT premium",
        "pride travel packages",
        "cruceros gay",
        "hoteles inclusivos",
        "viajes seguros LGBT",
        "experiencias LGBT exclusivas"
      ]
    : [
        "viajes premium",
        "hoteles 5 estrellas",
        "viajes de lujo México",
        "agencia viajes premium",
        "experiencias VIP",
        "turismo exclusivo"
      ];

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead 
        title={seoTitle} 
        description={seoDescription} 
        keywords={seoKeywords}
        appendBrand={false}
      />
      <OrganizationSchema />
      <WebsiteSchema />
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        
        <section className="relative z-20 -mt-12 mb-8 md:-mt-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <TarifasEspecialesSection />
          </div>
        </section>
        <DestinationsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
        <RntTrustSection />
      </main>
      <Footer />
    </div>
  );
}
