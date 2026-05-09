import { XcaretLanding, type XcaretLandingConfig } from "@/components/xcaret-landing-template";
import heroImg from "@assets/generated_images/luxury_mexican_hotels_collage.png";

const config: XcaretLandingConfig = {
  brand: "fenix",
  metaTitle: "Hotel Xcaret México — Menores Gratis 2026 | Fenix Traveler",
  metaDescription: "Vacaciones en familia en Hotel Xcaret México con menores GRATIS en 2026. Todo incluido, parques, shows, cultura maya. Cotiza hoy y asegura tu viaje.",
  keywords: "Hotel Xcaret México familia, menores gratis Xcaret, todo incluido Xcaret 2026, vacaciones familia México",
  waNumber: "524434044104",

  hero: {
    eyebrow: "Fenix Traveler · Oferta Exclusiva 2026",
    headline: "Vacaciones en Xcaret donde tus hijos entran gratis",
    sub: "Hotel Xcaret México todo incluido: parques, shows de clase mundial y la magia maya — sin pagar extra por los niños. Plazas muy limitadas.",
    ctaLabel: "Quiero info de Xcaret con menores gratis",
    waMessage: "Hola! Quiero información sobre Hotel Xcaret México con menores gratis en 2026. ¿Cuáles son las fechas y condiciones disponibles?",
    badge: "✨ Menores Gratis · Solo 2026",
    bgClass: "bg-gradient-to-br from-teal-800 via-emerald-900 to-green-900",
    bgImage: heroImg,
  },

  benefits: [
    { icon: "👶", title: "Menores gratis en 2026", desc: "Niños en categorías específicas sin costo adicional al precio del adulto. Condiciones vigentes todo 2026." },
    { icon: "🎭", title: "Parques incluidos", desc: "Xcaret, Xel-Há, Xoximilco y más: todos los parques del grupo incluidos sin costo extra." },
    { icon: "🍽️", title: "Todo incluido real", desc: "Comidas, bebidas, snacks y minibar desde el día 1. No hay cobros sorpresa al final de tu estancia." },
    { icon: "🌊", title: "Playa privada", desc: "Acceso directo a la playa del resort, cenotes y ríos subterráneos dentro del parque." },
    { icon: "🎪", title: "Shows nocturnos", desc: "Espectáculos de cultura mexicana y precolombina incluidos cada noche, sin reserva adicional." },
    { icon: "🛡️", title: "Reserva segura", desc: "Anticipo flexible del 30%. Paga el resto antes de tu llegada. Sin penalidad con tiempo." },
  ],

  emotional: {
    headline: "No son solo vacaciones. Son los recuerdos que tus hijos van a contar de adultos.",
    body: "Imagina a tus hijos corriendo entre ríos subterráneos, descubriendo la cultura maya y durmiendo en uno de los hoteles más espectaculares de México — sin que el precio por niño te quite el sueño.",
    highlight: "Mientras otros hoteles cobran por cada niño, en Xcaret los menores van gratis. Esa diferencia se siente en tu cartera y en sus caras.",
  },

  features: [
    { icon: "🏊", label: "Albercas temáticas" },
    { icon: "🐠", label: "Snorkel incluido" },
    { icon: "🦋", label: "Mariposas y tortugas" },
    { icon: "🍕", label: "Restaurantes temáticos" },
    { icon: "🎨", label: "Actividades para niños" },
    { icon: "🏖️", label: "Playa privada" },
    { icon: "🌺", label: "Jardines tropicales" },
    { icon: "🚌", label: "Transfer incluido" },
  ],

  testimonials: [
    { quote: "Viajamos con tres hijos y fue la mejor decisión. Los niños lloraron de felicidad en el show nocturno. El precio con menores gratis fue increíble.", author: "Familia Martínez", origin: "CDMX · Viaje 2025" },
    { quote: "El todo incluido es de verdad todo incluido. No gastamos ni un peso extra en el hotel. Los parques son de otro nivel.", author: "Laura y Jorge", origin: "Guadalajara · Semana Santa" },
    { quote: "Fenix Traveler nos consiguió el precio más bajo que encontramos. Respuesta inmediata por WhatsApp. Los recomiendo 100%.", author: "Familia Herrera", origin: "Monterrey · Verano 2025" },
  ],

  urgency: {
    headline: "⚡ Lugares limitados para 2026",
    items: [
      "Temporada alta julio–agosto: quedan menos de 20 habitaciones disponibles",
      "La tarifa con menores gratis no estará disponible todo el año",
      "Anticipo del 30% asegura tu precio actual — sube en temporada",
      "Grupos de más de 4 habitaciones requieren reserva anticipada",
    ],
    ctaLabel: "Apartar mi viaje ahora",
    waMessage: "Hola! Quiero apartar mi viaje a Hotel Xcaret México con menores gratis. ¿Cuáles son las fechas y disponibilidad actual?",
  },

  finalCta: {
    headline: "Deja de posponerlo. Este precio no va a durar.",
    sub: "Escríbenos ahora, te respondemos en minutos con disponibilidad real y precios actualizados.",
    ctaLabel: "Cotizar mi viaje familiar en Xcaret",
    waMessage: "Hola! Quiero cotizar vacaciones familiares en Hotel Xcaret México con menores gratis en 2026.",
  },
};

export default function XcaretFamilias() {
  return <XcaretLanding config={config} slug="xcaret-familias" />;
}
