import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, MessageCircle, Phone, Heart } from "lucide-react";

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const orbs = sectionRef.current.querySelectorAll(".floating-orb");
    orbs.forEach((orb, i) => {
    });
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900/80 to-cyan-900" />
      <div className="absolute inset-0 gradient-emotional opacity-40" />
      
      <div className="absolute -left-20 top-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl floating-orb" />
      <div className="absolute -right-20 bottom-20 h-60 w-60 rounded-full bg-pink-500/20 blur-3xl floating-orb" />
      <div className="absolute left-1/3 bottom-1/4 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl floating-orb" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center space-y-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">
                Ofertas Exclusivas
              </span>
            </div>
            
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Únete a nuestra{" "}
              <span className="text-gradient-premium">comunidad</span>
            </h2>
            
            <p className="text-lg text-white/85 leading-relaxed">
              Recibe ofertas exclusivas, destinos nuevos y contenido especial 
              directamente en tu correo. Sin spam, solo inspiración para tu próximo viaje.
            </p>
            
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-purple-400 focus:ring-purple-400/30"
                data-testid="input-cta-email"
              />
              <Button
                type="submit"
                className="gap-2 gradient-pride-subtle border border-white/20 text-white glow-soft"
                data-testid="button-cta-subscribe"
              >
                Suscribirme
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            
            <p className="flex items-center gap-2 text-sm text-white/50">
              <Heart className="h-4 w-4 text-pink-400" />
              Respetamos tu privacidad. Puedes darte de baja en cualquier momento.
            </p>
          </div>
          
          <div className="flex flex-col justify-center space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8 glow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                <Phone className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  ¿Necesitas ayuda?
                </h3>
                <p className="text-sm text-white/60">Estamos aquí para ti</p>
              </div>
            </div>
            
            <p className="text-white/80 leading-relaxed">
              Nuestros asesores expertos te ayudan a crear la experiencia de viaje perfecta, 
              adaptada a tus preferencias y necesidades.
            </p>
            
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-white/20 bg-white/5 text-white backdrop-blur-sm depth-hover"
                  data-testid="button-cta-contact"
                >
                  <Phone className="h-4 w-4" />
                  Agenda con un asesor
                </Button>
              </Link>
              <a
                href="https://wa.me/524434044104"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white border border-green-400/30 glow-soft"
                  data-testid="button-cta-whatsapp"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 border-t border-white/10 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="text-xs text-white/50">Disponibilidad</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">&lt;2h</p>
                <p className="text-xs text-white/50">Respuesta</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-white/50">Satisfacción</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
