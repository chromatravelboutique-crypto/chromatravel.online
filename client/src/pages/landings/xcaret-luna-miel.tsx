import { XcaretLanding, type XcaretLandingConfig } from "@/components/xcaret-landing-template";
import heroImg from "@assets/generated_images/romantic_anniversary_dinner_terrace.png";

const config: XcaretLandingConfig = {
  brand: "fenix",
  metaTitle: "Luna de Miel en Xcaret México — Paquetes Románticos | Fenix Traveler",
  metaDescription: "Luna de miel inolvidable en Hotel Xcaret México. Habitación con jacuzzi, cenas románticas, spa y detalles especiales incluidos. El inicio perfecto para su historia.",
  keywords: "luna de miel Xcaret México, honeymoon Hotel Xcaret, paquete romántico Xcaret, viaje novios México",
  waNumber: "524434044104",

  hero: {
    eyebrow: "Fenix Traveler · Luna de Miel",
    headline: "Empieza tu vida juntos en el lugar más romántico de México",
    sub: "Hotel Xcaret México todo incluido: habitación con jacuzzi privado, cena romántica en la playa, spa para dos y la magia de la Riviera Maya como escenario.",
    ctaLabel: "Quiero cotizar nuestra luna de miel",
    waMessage: "Hola! Queremos cotizar nuestra luna de miel en Hotel Xcaret México. ¿Qué paquetes románticos tienen disponibles?",
    badge: "💑 Luna de Miel · Paquete Especial",
    bgClass: "bg-gradient-to-br from-rose-900 via-purple-900 to-teal-900",
    bgImage: heroImg,
  },

  benefits: [
    { icon: "🛁", title: "Suite con jacuzzi privado", desc: "Habitaciones diseñadas para parejas, con jacuzzi en terraza o interior, vista al mar o jardín tropical." },
    { icon: "🕯️", title: "Cena romántica en la playa", desc: "Una noche especial con mesa privada, velas, música y menú de degustación a la orilla del mar caribe." },
    { icon: "💆", title: "Spa para dos incluido", desc: "Sesión de masajes y tratamientos para la pareja. El relax que necesitan después del estrés de la boda." },
    { icon: "🥂", title: "Botella de champagne de bienvenida", desc: "Llegan a su cuarto con champagne, flores y detalles románticos preparados especialmente para ustedes." },
    { icon: "🎭", title: "Todos los parques incluidos", desc: "Xcaret, Xel-Há, Xoximilco: los mejores parques de la Riviera Maya incluidos para que vivan la aventura juntos." },
    { icon: "📸", title: "Sesión de fotos de novios", desc: "Sesión fotográfica profesional en las locaciones más icónicas del hotel. Recuerdos para toda la vida." },
  ],

  emotional: {
    headline: "Porque el primer 'para siempre' merece el escenario perfecto.",
    body: "La luna de miel no es solo un viaje. Es la primera historia que van a contar juntos. Xcaret te da la cenotes, la selva, el mar y la privacidad para que ese capítulo sea exactamente como lo imaginaron.",
    highlight: "Parejas que eligen Xcaret para su luna de miel no vuelven a un hotel convencional. El estándar sube para siempre.",
  },

  features: [
    { icon: "🌅", label: "Amanecer en la playa" },
    { icon: "🐠", label: "Snorkel en pareja" },
    { icon: "🌊", label: "Río subterráneo" },
    { icon: "🌺", label: "Jardines privados" },
    { icon: "🍷", label: "Cata de vinos" },
    { icon: "🌙", label: "Shows nocturnos" },
    { icon: "🏊", label: "Alberca infinity" },
    { icon: "🛶", label: "Kayak en cenote" },
  ],

  testimonials: [
    { quote: "Nuestra luna de miel en Xcaret superó todo lo que esperábamos. La cena en la playa fue mágica. Volvimos a los dos años de aniversario.", author: "Ana y Miguel", origin: "CDMX · Luna de miel 2024" },
    { quote: "La suite con jacuzzi y vista al mar fue lo mejor. Despertarnos con esa vista cada mañana no tiene precio. Gracias Fenix Traveler por organizarlo todo.", author: "Daniela y Pablo", origin: "Guadalajara · 2025" },
    { quote: "Fenix nos consiguió detalles adicionales sin costo: champagne extra y una sorpresa en el cuarto. Se notó que les importa el cliente.", author: "Mariana y Luis", origin: "Monterrey" },
  ],

  urgency: {
    headline: "💍 Recién casados merecen el mejor precio",
    items: [
      "Paquetes luna de miel con descuento especial disponibles por tiempo limitado",
      "Las suites junior suite y superiores se agotan para fechas de temporada",
      "Coordinar con anticipación garantiza todos los detalles románticos disponibles",
      "Combina con tu boda en Xcaret y obtén tarifa especial para los novios",
    ],
    ctaLabel: "Ver disponibilidad para nuestra luna de miel",
    waMessage: "Hola! Queremos información sobre paquetes de luna de miel en Xcaret. Tenemos planeado viajar aproximadamente en [mes/fecha].",
  },

  finalCta: {
    headline: "Su historia empieza aquí.",
    sub: "Escríbenos ahora. En minutos tendrán opciones, precios y disponibilidad real para su luna de miel perfecta.",
    ctaLabel: "Cotizar luna de miel en Xcaret",
    waMessage: "Hola! Queremos cotizar nuestra luna de miel en Hotel Xcaret México con paquete romántico.",
  },
};

export default function XcaretLunaMiel() {
  return <XcaretLanding config={config} slug="xcaret-luna-miel" />;
}
