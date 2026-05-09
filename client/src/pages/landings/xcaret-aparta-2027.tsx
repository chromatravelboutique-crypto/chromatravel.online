import { XcaretLanding, type XcaretLandingConfig } from "@/components/xcaret-landing-template";
import heroImg from "@assets/generated_images/luxury_boutique_hotel_dusk.png";

const config: XcaretLandingConfig = {
  brand: "fenix",
  metaTitle: "Reserva Xcaret 2027 — 40% de Anticipo y Precio Fijo | Fenix Traveler",
  metaDescription: "Asegura tu viaje a Hotel Xcaret México en 2027 con solo el 40% de anticipo. Precio fijo garantizado, paga el resto cuando quieras antes de tu llegada.",
  keywords: "Xcaret 2027 reserva anticipada, Hotel Xcaret precio fijo, anticipo Xcaret, Xcaret México 2027",
  waNumber: "524434044104",

  hero: {
    eyebrow: "Fenix Traveler · Pre-Reserva 2027",
    headline: "Asegura tu Xcaret 2027 hoy y paga el resto después",
    sub: "Con solo el 40% de anticipo, el precio queda bloqueado a la tarifa 2026. Las tarifas 2027 serán más altas. Quien aparta hoy, gana.",
    ctaLabel: "Apartar mi viaje con 40% de anticipo",
    waMessage: "Hola! Me interesa pre-reservar Hotel Xcaret México para 2027 con el 40% de anticipo. ¿Cuáles son los precios y fechas disponibles?",
    badge: "🔒 Precio 2026 Garantizado para 2027",
    bgClass: "bg-gradient-to-br from-blue-900 via-teal-900 to-emerald-900",
    bgImage: heroImg,
  },

  benefits: [
    { icon: "🔒", title: "Precio bloqueado a tarifa 2026", desc: "Pagas el precio de hoy aunque reserves para el año que viene. Las tarifas 2027 van a subir, tú te adelantas." },
    { icon: "💰", title: "Solo 40% de anticipo", desc: "No necesitas tener todo el dinero ahora. Aparta con el 40% y liquida el resto cómodamente antes de tu viaje." },
    { icon: "📅", title: "Elige tus fechas con calma", desc: "Puedes modificar fechas una vez sin penalidad dentro de los primeros 60 días de reserva." },
    { icon: "🎟️", title: "Todos los parques incluidos", desc: "Xcaret, Xel-Há, Xoximilco y más — el acceso a los parques del grupo va incluido en tu paquete." },
    { icon: "🌮", title: "Todo incluido premium", desc: "Comidas, bebidas, snacks, minibar. Gastronomía mexicana e internacional sin límites ni cargos extra." },
    { icon: "✈️", title: "Transfer incluido", desc: "Traslado aeropuerto-hotel-aeropuerto incluido en tu reserva. Llegás y te relajás." },
  ],

  emotional: {
    headline: "El que espera, paga más. El que actúa hoy, viaja mejor.",
    body: "Cada año los precios de Xcaret suben entre el 15% y el 25%. Los que pre-reservan ahora bloquean el precio de hoy para disfrutarlo el año que viene. No es un truco — es aritmética.",
    highlight: "Con el 40% de anticipo asegurado, los $10,000 que 'ahorras' hoy se convierten en más experiencias dentro del resort.",
  },

  features: [
    { icon: "🏖️", label: "Playa privada" },
    { icon: "🎭", label: "Shows nocturnos" },
    { icon: "🐢", label: "Tortugas marinas" },
    { icon: "🍹", label: "Bebidas ilimitadas" },
    { icon: "🌊", label: "Río subterráneo" },
    { icon: "🦋", label: "Mariposario" },
    { icon: "🧖", label: "Spa disponible" },
    { icon: "🎶", label: "Música en vivo" },
  ],

  testimonials: [
    { quote: "Pre-reservé en agosto y viajé en abril del año siguiente. El precio fue $4,000 MXN más barato que si lo hubiera comprado en enero. Vale totalmente la pena.", author: "Carlos V.", origin: "Puebla · Reserva anticipada" },
    { quote: "Fenix Traveler me explicó todo el proceso. El anticipo fue fácil, la atención excelente y el viaje increíble. Los recomiendo siempre.", author: "Mariana y Roberto", origin: "Querétaro" },
    { quote: "Sabía que los precios iban a subir. Aparté con el 40% y ahorré casi $7,000 pesos por adulto. Es la estrategia más inteligente.", author: "Familia Soto", origin: "León · 2026" },
  ],

  urgency: {
    headline: "⏳ Las suites se apartan primero",
    items: [
      "Solo las mejores fechas (Semana Santa, verano, fin de año) están disponibles para pre-reserva",
      "El precio 2026 solo está disponible hasta el 31 de diciembre de 2026",
      "Cupos de pre-reserva limitados — no todos los tipos de cuarto aplican",
      "El incremento de tarifa 2027 puede llegar hasta el 30% más",
    ],
    ctaLabel: "Bloquear mi precio hoy",
    waMessage: "Hola! Quiero pre-reservar Xcaret 2027 y bloquear el precio 2026. ¿Qué fechas y habitaciones hay disponibles?",
  },

  finalCta: {
    headline: "Tu viaje 2027 empieza hoy con una sola decisión.",
    sub: "Escríbenos, te enviamos cotización con precios actuales y fechas disponibles en menos de 10 minutos.",
    ctaLabel: "Apartar Xcaret 2027 ahora",
    waMessage: "Hola! Quiero apartar mi viaje a Xcaret 2027 con el anticipo del 40% y precio 2026 garantizado.",
  },
};

export default function XcaretAparta2027() {
  return <XcaretLanding config={config} slug="xcaret-aparta-2027" />;
}
