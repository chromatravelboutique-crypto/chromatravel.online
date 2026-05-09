import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Destination } from "@shared/schema";

import barcelonaImage from "@assets/generated_images/barcelona_destination_aerial.png";
import puertovallartaImage from "@assets/generated_images/puerto_vallarta_destination.png";
import amsterdamImage from "@assets/generated_images/amsterdam_canal_sunset.png";
import mykonosImage from "@assets/generated_images/mykonos_greece_destination.png";

const destinationImages: Record<string, string> = {
  "barcelona": barcelonaImage,
  "puerto-vallarta": puertovallartaImage,
  "amsterdam": amsterdamImage,
  "mykonos": mykonosImage,
};

function DestinationSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

interface PremiumDestinationCardProps {
  id: string;
  name: string;
  country: string;
  image: string;
  lgbtScore: number;
  shortDescription: string;
  index: number;
}

function PremiumDestinationCard({ id, name, country, image, lgbtScore, shortDescription, index }: PremiumDestinationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
    };

    const handleMouseLeave = () => {
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <Link href={`/destinations/${id}`}>
      <div
        ref={cardRef}
        className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm transition-all duration-300 glow-card"
        style={{ transformStyle: "preserve-3d", animationDelay: `${index * 0.1}s` }}
        data-testid={`card-destination-${id}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{lgbtScore}/10 LGBT+</span>
          </div>
          
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-display text-xl font-bold text-white">{name}</h3>
            <div className="flex items-center gap-1 text-sm text-white/80">
              <MapPin className="h-3 w-3" />
              <span>{country}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{shortDescription}</p>
          
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-purple-400">Destino verificado</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
          style={{ 
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 50%, rgba(34, 211, 238, 0.1) 100%)",
            pointerEvents: "none"
          }} 
        />
      </div>
    </Link>
  );
}

export function DestinationsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data: destinations, isLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations", { featured: true }],
    queryFn: async () => {
      const res = await fetch("/api/destinations?featured=true");
      if (!res.ok) throw new Error("Failed to fetch destinations");
      return res.json();
    },
  });

  useEffect(() => {
    if (!sectionRef.current) return;

    const title = sectionRef.current.querySelector(".section-title");
    if (title) {
    }
  }, []);

  return (
    <section ref={sectionRef} className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 gradient-emotional opacity-30" />
      
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="section-title mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="mb-2 inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
              Destinos Destacados
            </span>
            <h2 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
              Lugares donde{" "}
              <span className="text-gradient-premium">serás bienvenido</span>
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Destinos cuidadosamente seleccionados donde la inclusión no es solo una palabra, 
              sino una experiencia que vivirás en cada momento.
            </p>
          </div>
          <Link href="/destinations">
            <Button variant="outline" className="gap-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10" data-testid="button-view-all-destinations">
              Explorar todos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <DestinationSkeleton />
              <DestinationSkeleton />
              <DestinationSkeleton />
              <DestinationSkeleton />
            </>
          ) : destinations && destinations.length > 0 ? (
            destinations.slice(0, 4).map((destination, index) => (
              <PremiumDestinationCard
                key={destination.id}
                id={destination.slug || destination.id}
                name={destination.name}
                country={destination.country}
                image={destinationImages[destination.slug || ""] || destination.image || barcelonaImage}
                lgbtScore={destination.lgbtFriendlyScore || 8}
                shortDescription={destination.shortDescription || destination.description || ""}
                index={index}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">
              No hay destinos destacados disponibles.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
