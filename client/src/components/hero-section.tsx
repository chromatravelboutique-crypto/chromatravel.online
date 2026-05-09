import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Heart, Sparkles, Phone } from "lucide-react";
import { LazyWebGLScene } from "@/components/three-webgl";
import heroImage from "@assets/generated_images/lgbt_couple_beach_sunset.png";

function useParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      const layers = container.querySelectorAll(".parallax-layer");
      layers.forEach((layer, index) => {
        const depth = (index + 1) * 8;
        const moveX = x * depth;
        const moveY = y * depth;
      });
    };
    
    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  return containerRef;
}

export function HeroSection() {
  const parallaxRef = useParallax();
  const textRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!textRef.current) return;
    
    const elements = textRef.current.querySelectorAll(".animate-in");
  }, []);

  return (
    <section 
      ref={parallaxRef}
      className="relative min-h-[90vh] w-full overflow-hidden parallax-container"
    >
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={heroImage}
          className="h-full w-full object-cover scale-105"
          data-testid="video-hero-background"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-transparent to-cyan-900/20" />
        <div className="absolute inset-0 gradient-emotional opacity-60" />
      </div>

      <div className="absolute inset-0 z-[1]">
        <LazyWebGLScene />
      </div>

      <div 
        ref={textRef}
        className="relative z-10 mx-auto flex min-h-[90vh] max-w-7xl flex-col items-start justify-center px-4 py-24 md:px-8"
      >
        <div className="max-w-2xl space-y-8 parallax-layer">
          <div className="animate-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-md">
              <Heart className="h-4 w-4 text-pink-400" />
              Viajes diseñados para ti
            </span>
          </div>

          <h1 className="animate-in font-display text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl xl:text-7xl">
            Viaja con{" "}
            <span className="text-gradient-premium animate-gradient-shift">
              libertad
            </span>
            <br />
            <span className="text-white/90">y tranquilidad</span>
          </h1>

          <p className="animate-in max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
            Experiencias de viaje premium donde cada detalle está pensado para tu 
            <span className="text-purple-300"> bienestar</span>,{" "}
            <span className="text-pink-300">seguridad</span> y{" "}
            <span className="text-cyan-300">felicidad</span>. 
            Hoteles verificados, destinos inclusivos y asesoría personalizada.
          </p>

          <div className="animate-in flex flex-wrap gap-4 pt-2">
            <Link href="/hotels">
              <Button 
                size="lg" 
                className="gap-2 text-base gradient-pride-subtle border border-white/20 text-white glow-soft" 
                data-testid="button-hero-search"
              >
                <Sparkles className="h-5 w-5" />
                Viaja con tranquilidad
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 border-white/30 bg-white/10 text-base text-white backdrop-blur-md depth-hover"
                data-testid="button-hero-advisor"
              >
                <Phone className="h-5 w-5" />
                Agenda con un asesor
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-5 md:justify-start md:gap-12 md:px-8">
          <div className="flex items-center gap-3 text-white/90 depth-hover">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 backdrop-blur-sm">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">500+ Hoteles</span>
              <span className="text-xs text-white/60">Verificados</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/90 depth-hover">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/20 backdrop-blur-sm">
              <Heart className="h-5 w-5 text-pink-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Cancelación</span>
              <span className="text-xs text-white/60">Flexible</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/90 depth-hover">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Asesoría</span>
              <span className="text-xs text-white/60">Personalizada</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
