import { useEffect, useRef } from "react";
import { Shield, Heart, Sparkles, Users, Globe, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Hoteles Verificados",
    description:
      "Cada hotel es cuidadosamente verificado para garantizar un ambiente seguro y acogedor.",
    gradient: "from-purple-500/20 to-purple-500/5",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Heart,
    title: "Experiencias Inclusivas",
    description:
      "Curada selección de experiencias diseñadas para celebrar la diversidad y tu libertad de ser.",
    gradient: "from-pink-500/20 to-pink-500/5",
    iconBg: "bg-pink-500/20",
    iconColor: "text-pink-400",
  },
  {
    icon: Users,
    title: "Asesoría Personalizada",
    description:
      "Nuestros asesores expertos te ayudan a planificar el viaje perfecto según tus preferencias.",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: Globe,
    title: "Destinos Globales",
    description:
      "Acceso a los mejores destinos LGBT-friendly, desde playas paradisíacas hasta ciudades cosmopolitas.",
    gradient: "from-orange-500/20 to-orange-500/5",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    icon: Lock,
    title: "Reservas Seguras",
    description:
      "Proceso de reserva 100% seguro con encriptación de datos y múltiples opciones de pago.",
    gradient: "from-purple-500/20 to-purple-500/5",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Sparkles,
    title: "Precios Exclusivos",
    description:
      "Tarifas negociadas directamente con los proveedores para ofrecerte los mejores precios.",
    gradient: "from-pink-500/20 to-pink-500/5",
    iconBg: "bg-pink-500/20",
    iconColor: "text-pink-400",
  },
];

interface FeatureCardProps {
  feature: typeof features[0];
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    
    const handleMouseEnter = () => {
    };

    const handleMouseLeave = () => {
    };

    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <Card
      ref={cardRef}
      className={`relative overflow-hidden p-6 bg-gradient-to-br ${feature.gradient} border-white/10 backdrop-blur-sm depth-hover glow-card`}
      style={{ animationDelay: `${index * 0.1}s` }}
      data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-xl" />
      
      <div className="relative">
        <div
          className={`feature-icon mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${feature.iconBg} ${feature.iconColor}`}
        >
          <feature.icon className="h-7 w-7" />
        </div>
        
        <h3 className="mb-3 font-display text-lg font-semibold">
          {feature.title}
        </h3>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {feature.description}
        </p>

        <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-50" />
      </div>
    </Card>
  );
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const cards = sectionRef.current.querySelectorAll(".depth-hover");
  }, []);

  return (
    <section ref={sectionRef} className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/3 h-48 w-48 rounded-full bg-pink-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <span className="mb-2 inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
            Nuestra Promesa
          </span>
          <h2 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            ¿Por qué{" "}
            <span className="text-gradient-premium">elegirnos</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Nos dedicamos a crear experiencias de viaje extraordinarias con 
            seguridad, inclusión y excelencia en cada detalle.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
