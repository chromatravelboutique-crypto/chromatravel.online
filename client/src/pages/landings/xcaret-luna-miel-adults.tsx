import { XcaretLanding, type XcaretLandingConfig } from "@/components/xcaret-landing-template";
import heroImg from "@assets/generated_images/tulum_ruins_romantic_sunset.png";

const config: XcaretLandingConfig = {
  brand: "chroma",
  metaTitle: "Luna de Miel LGBT+ en Xcaret Arte — Solo Adultos | Chroma Travel",
  metaDescription: "Luna de miel para parejas LGBT+ en Hotel Xcaret Arte solo adultos. Suite de lujo, spa para dos, cenas íntimas y libertad total en el Caribe mexicano.",
  keywords: "luna de miel LGBT Xcaret Arte, honeymoon gay México, luna de miel pareja mismo sexo, Xcaret Arte novios LGBT",
  waNumber: "524434044104",

  hero: {
    eyebrow: "Chroma Travel · Luna de Miel LGBT+",
    headline: "Su primera historia juntos, en el lugar que los merece.",
    sub: "Hotel Xcaret Arte solo adultos: suite con vista al mar, spa para dos, cena privada en la playa y libertad total para ser su pareja sin calcular el entorno.",
    ctaLabel: "Cotizar nuestra luna de miel en Xcaret Arte",
    waMessage: "Hola! Queremos cotizar nuestra luna de miel en Hotel Xcaret Arte como pareja LGBT+. ¿Qué paquetes románticos tienen?",
    badge: "💑🌈 Luna de Miel · LGBT+ Welcome",
    bgClass: "bg-gradient-to-br from-emerald-900 via-teal-900 to-purple-900",
    bgImage: heroImg,
  },

  benefits: [
    { icon: "🌊", title: "Suite premium con vista al mar", desc: "Habitaciones diseñadas para parejas con las mejores vistas del Caribe. Cada mañana con el mar como protagonista." },
    { icon: "💆", title: "Spa Muluk para dos", desc: "Masajes y rituales prehispánicos diseñados para pareja. La experiencia más relajante después de cualquier celebración." },
    { icon: "🕯️", title: "Cena romántica privada", desc: "Mesa exclusiva en la playa o terraza privada. Menú de degustación de los mejores chefs del grupo. La noche perfecta." },
    { icon: "🥂", title: "Recepción de novios con champagne", desc: "Llegan a una suite lista para celebrar: champagne, flores y detalles pensados específicamente para ustedes." },
    { icon: "🌈", title: "Ambiente 100% LGBT+ friendly", desc: "No hay ningún momento en que tengan que cuestionarse si son bienvenidos. Xcaret Arte está diseñado para que su pareja sea visible." },
    { icon: "🎨", title: "Gastronomía de autor ilimitada", desc: "12 restaurantes de chefs internacionales incluidos. El menú de su luna de miel lo define su apetito, no un límite." },
  ],

  emotional: {
    headline: "La luna de miel que se merecen: sin compromisos, sin restricciones, sin miradas.",
    body: "Hay parejas que vuelven de su luna de miel con fotos hermosas pero con la fatiga de tener que estar pendientes del entorno. En Xcaret Arte, eso no existe. Solo existen ustedes dos y lo que quieren vivir.",
    highlight: "Su luna de miel en Xcaret Arte no va a ser el inicio de su vida juntos. Va a ser el estándar de lo que merecen siempre.",
  },

  features: [
    { icon: "🌅", label: "Amanecer en la playa" },
    { icon: "🍣", label: "Omakase privado" },
    { icon: "🛁", label: "Bañera de lujo" },
    { icon: "🌺", label: "Decoración floral" },
    { icon: "🎭", label: "Shows culturales" },
    { icon: "🌊", label: "Cenotes exclusivos" },
    { icon: "📸", label: "Sesión fotográfica" },
    { icon: "🧖", label: "Tratamientos faciales" },
  ],

  testimonials: [
    { quote: "Nuestra luna de miel en Xcaret Arte fue lo más libre que nos hemos sentido de pareja. Nada de miradas, nada de incomodidad. Solo amor y lujo.", author: "Miguel y Óscar", origin: "CDMX · Luna de miel 2025" },
    { quote: "La cena privada en la playa fue algo que no vamos a olvidar nunca. El servicio fue impecable. Chroma Travel organizó todo perfectamente.", author: "Sandra y Carla", origin: "Guadalajara · 2024" },
    { quote: "Elegimos Xcaret Arte porque queríamos libertad total. No nos decepcionó. El spa para dos, el champagne al llegar, la suite... todo fue perfecto.", author: "David y Tomás", origin: "Monterrey · 2025" },
  ],

  urgency: {
    headline: "💑 Las mejores suites se van primero",
    items: [
      "Suites con vista al mar: disponibilidad muy limitada para temporada alta",
      "Paquetes luna de miel con spa incluido: cupos limitados por semana",
      "Junio–agosto y diciembre: temporada pico, reservar con 3+ meses de anticipación",
      "Quien reserva hoy elige la mejor habitación y garantiza todos los detalles",
    ],
    ctaLabel: "Verificar disponibilidad para nuestra luna de miel",
    waMessage: "Hola! Queremos verificar disponibilidad para luna de miel LGBT+ en Xcaret Arte. ¿Qué fechas tienen y cuáles son los precios?",
  },

  finalCta: {
    headline: "El principio de todo empieza con un mensaje.",
    sub: "Escríbenos ahora. En minutos tienen opciones reales, disponibilidad y precios para la luna de miel que se merecen.",
    ctaLabel: "Iniciar cotización de luna de miel",
    waMessage: "Hola! Somos una pareja LGBT+ y queremos cotizar nuestra luna de miel en Hotel Xcaret Arte.",
  },
};

export default function XcaretLunaMielAdults() {
  return <XcaretLanding config={config} slug="xcaret-luna-miel-adults" />;
}
