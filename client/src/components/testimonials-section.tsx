import { useEffect, useRef } from "react";
import { Star, Quote, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    id: "1",
    name: "Carlos M.",
    location: "Ciudad de México",
    rating: 5,
    text: "Increíble experiencia en Puerto Vallarta. El hotel que nos recomendaron era perfecto, nos sentimos completamente cómodos y bienvenidos. Sin duda volveremos a reservar.",
    initials: "CM",
    color: "from-purple-500/20 to-purple-500/5",
  },
  {
    id: "2",
    name: "Andrea & Laura",
    location: "Guadalajara",
    rating: 5,
    text: "Nuestra luna de miel en Mykonos fue mágica. Todo estuvo perfectamente organizado y los hoteles realmente cumplieron con ser LGBT-friendly. El equipo de asesores fue increíble.",
    initials: "AL",
    color: "from-pink-500/20 to-pink-500/5",
  },
  {
    id: "3",
    name: "Roberto S.",
    location: "Monterrey",
    rating: 5,
    text: "Por fin una agencia que entiende nuestras necesidades. Barcelona fue espectacular y me sentí seguro en todo momento. La atención personalizada hace toda la diferencia.",
    initials: "RS",
    color: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    id: "4",
    name: "Diana P.",
    location: "Querétaro",
    rating: 5,
    text: "Amsterdam superó todas mis expectativas. Se encargaron de todo y pude disfrutar sin preocupaciones. Los precios fueron muy competitivos.",
    initials: "DP",
    color: "from-orange-500/20 to-orange-500/5",
  },
];

function FloatingHeart({ delay = 0, left = "10%", size = 16 }: { delay?: number; left?: string; size?: number }) {
  const heartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heartRef.current) return;
  }, [delay]);

  return (
    <div
      ref={heartRef}
      className="absolute bottom-10 text-pink-500/20"
      style={{ left }}
    >
      <Heart style={{ width: size, height: size }} fill="currentColor" />
    </div>
  );
}

interface TestimonialCardProps {
  testimonial: typeof testimonials[0];
  index: number;
}

function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
  }, [index]);

  return (
    <Card
      ref={cardRef}
      className={`relative overflow-hidden p-6 bg-gradient-to-br ${testimonial.color} border-white/10 backdrop-blur-sm glow-card depth-hover`}
      data-testid={`card-testimonial-${testimonial.id}`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-2xl" />
      
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="border-2 border-white/10">
              <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-white">
                {testimonial.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{testimonial.name}</p>
              <p className="text-sm text-muted-foreground">
                {testimonial.location}
              </p>
            </div>
          </div>
          <Quote className="h-8 w-8 text-purple-500/30" />
        </div>

        <div className="mb-4 flex gap-0.5">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>

        <p className="text-muted-foreground leading-relaxed">{testimonial.text}</p>

        <div className="mt-4 flex items-center gap-2">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
          <span className="text-xs text-purple-400">Viaje verificado</span>
        </div>
      </div>
    </Card>
  );
}

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={sectionRef} className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-pink-500/5 blur-3xl" />
      </div>

      <FloatingHeart delay={0} left="10%" size={20} />
      <FloatingHeart delay={1} left="30%" size={14} />
      <FloatingHeart delay={2} left="70%" size={18} />
      <FloatingHeart delay={0.5} left="85%" size={16} />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <span className="mb-2 inline-block rounded-full bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-400">
            Nuestra Comunidad
          </span>
          <h2 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            Historias que{" "}
            <span className="text-gradient-premium">inspiran</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Miles de viajeros han confiado en nosotros para crear experiencias 
            donde pueden ser completamente auténticos.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {["CM", "AL", "RS"].map((initials, i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-xs text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">+2,500 viajeros felices</p>
              <p className="text-xs text-muted-foreground">en los últimos 12 meses</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
