import { XcaretLanding, type XcaretLandingConfig } from "@/components/xcaret-landing-template";
import heroImg from "@assets/generated_images/pride_parade_celebration.png";

const config: XcaretLandingConfig = {
  brand: "chroma",
  metaTitle: "Xcaret Arte LGBT+ — Solo Adultos | Chroma Travel",
  metaDescription: "Hotel Xcaret Arte: el resort solo adultos más lujoso de México. Gastronomía de autor, arte, wellness y libertad total para la comunidad LGBT+. Sin juicios, solo experiencia.",
  keywords: "Xcaret Arte LGBT, hotel gay friendly México, solo adultos Xcaret Arte, viaje LGBT Riviera Maya",
  waNumber: "524434044104",

  hero: {
    eyebrow: "Chroma Travel · Experiencia LGBT+ Premium",
    headline: "Xcaret Arte: donde puedes ser tú. Sin filtros. Sin juicios.",
    sub: "El resort solo adultos más artístico de México, diseñado para quienes saben que las mejores vacaciones son las que se viven sin límites. Arte, gastronomía, libertad.",
    ctaLabel: "Quiero una escapada en Xcaret Arte",
    waMessage: "Hola! Me interesa una estancia en Hotel Xcaret Arte. ¿Qué experiencias y paquetes tienen disponibles para la comunidad LGBT+?",
    badge: "🌈 Solo Adultos · LGBT+ Welcome",
    bgClass: "bg-gradient-to-br from-purple-900 via-pink-900 to-emerald-900",
    bgImage: heroImg,
  },

  benefits: [
    { icon: "🏛️", title: "Resort solo adultos", desc: "Sin niños, sin restricciones, sin explicaciones. Xcaret Arte es un espacio diseñado para adultos que saben lo que quieren." },
    { icon: "🎨", title: "Arte e identidad", desc: "12 restaurantes de autor, galerías de arte, arquitectura única. Un destino diseñado para quienes aprecian la belleza en todas sus formas." },
    { icon: "🌈", title: "Espacio 100% inclusivo", desc: "Todo el personal está entrenado en inclusión LGBT+. Aquí tu identidad y tu pareja son bienvenidas exactamente como son." },
    { icon: "🍽️", title: "Gastronomía de clase mundial", desc: "12 restaurantes con chefs internacionales. Desde sushi omakase hasta cocina de fuego. El mejor menú del Caribe mexicano." },
    { icon: "🌿", title: "Wellness & Spa premium", desc: "Spa Muluk: tratamientos inspirados en rituales prehispánicos. Yoga, meditación y masajes en entornos de selva." },
    { icon: "🎭", title: "Cultura sin clichés", desc: "Arte contemporáneo, shows de danza y música en vivo que celebran la diversidad cultural de México." },
  ],

  emotional: {
    headline: "Aquí no hay que explicar nada. Solo hay que disfrutarlo.",
    body: "Xcaret Arte no es un resort más con bandera de arcoíris. Es un lugar donde la estética, el arte y la libertad son parte de la arquitectura. Donde tu pareja puede tomarte de la mano sin calcular la mirada del cuarto.",
    highlight: "No vendemos habitaciones. Vendemos la experiencia de estar exactamente donde quieres estar, siendo exactamente quien eres.",
  },

  features: [
    { icon: "🍣", label: "12 restaurantes de autor" },
    { icon: "🌊", label: "Playa privada adultos" },
    { icon: "🧖", label: "Spa Muluk" },
    { icon: "🎨", label: "Galerías de arte" },
    { icon: "🏊", label: "Albercas temáticas" },
    { icon: "🎵", label: "Música en vivo" },
    { icon: "🦋", label: "Mariposario" },
    { icon: "🌙", label: "Shows nocturnos" },
  ],

  testimonials: [
    { quote: "Por fin un resort donde no tienes que 'portarte bien'. La gente fue increíblemente amable, el arte es impresionante y la comida de otro nivel.", author: "Alex y Rodrigo", origin: "CDMX · Pareja LGBT+ 2025" },
    { quote: "Viajé con mi pareja y fue la primera vez en México que me sentí completamente libre. Sin miradas raras, sin comentarios. Solo disfrute.", author: "Carmen y Sol", origin: "Guadalajara · 2025" },
    { quote: "Chroma Travel nos entendió desde el primer mensaje. Sabían exactamente lo que buscábamos. El hotel superó todas las expectativas.", author: "Diego y Marcos", origin: "Monterrey · 2024" },
  ],

  urgency: {
    headline: "🌈 Pride Season: los mejores precios del año",
    items: [
      "Junio y julio: temporada Pride con actividades y descuentos especiales",
      "Habitaciones dobles para parejas: disponibilidad muy limitada en temporada alta",
      "Paquetes LGBT+ con actividades exclusivas — cupos limitados",
      "Quien reserva con anticipación elige la mejor habitación y vista",
    ],
    ctaLabel: "Ver disponibilidad en Xcaret Arte",
    waMessage: "Hola! Quiero ver disponibilidad en Hotel Xcaret Arte para una escapada LGBT+. ¿Qué paquetes tienen disponibles?",
  },

  finalCta: {
    headline: "Tu escapada perfecta empieza con un mensaje.",
    sub: "Sin formularios largos, sin esperas. Escríbenos y en minutos tienes opciones reales adaptadas a lo que buscas.",
    ctaLabel: "Cotizar escapada en Xcaret Arte",
    waMessage: "Hola! Quiero cotizar una estancia en Hotel Xcaret Arte como viajero LGBT+. ¿Qué opciones y fechas tienen disponibles?",
  },
};

export default function XcaretArteLgbt() {
  return <XcaretLanding config={config} slug="xcaret-arte-lgbt" />;
}
