import { XcaretLanding, type XcaretLandingConfig } from "@/components/xcaret-landing-template";
import heroImg from "@assets/generated_images/beach_wedding_ceremony_setup.png";

const config: XcaretLandingConfig = {
  brand: "fenix",
  metaTitle: "Bodas en Hotel Xcaret México — Todo Incluido | Fenix Traveler",
  metaDescription: "Organiza tu boda en Hotel Xcaret México con ceremonia, banquete y luna de miel todo incluido. Paquetes para bodas íntimas o grandes celebraciones. Cotiza hoy.",
  keywords: "bodas en Xcaret México, boda todo incluido Xcaret, matrimonio Hotel Xcaret, bodas destino México",
  waNumber: "524434044104",

  hero: {
    eyebrow: "Fenix Traveler · Bodas en Xcaret",
    headline: "Tu boda más bonita, en el lugar más espectacular de México",
    sub: "Hotel Xcaret México: ceremonia con vista al mar, banquete gourmet, luna de miel y todos tus invitados todo incluido. Sin estrés, sin improvisaciones.",
    ctaLabel: "Quiero cotizar mi boda en Xcaret",
    waMessage: "Hola! Me interesa organizar mi boda en Hotel Xcaret México. ¿Pueden enviarme información sobre paquetes, precios y disponibilidad?",
    badge: "💍 Bodas Destino · México",
    bgClass: "bg-gradient-to-br from-rose-900 via-pink-900 to-teal-900",
    bgImage: heroImg,
  },

  benefits: [
    { icon: "💒", title: "Ceremonia con vista al mar", desc: "Espacios únicos al aire libre con fondo de selva y mar caribe. La boda que siempre imaginaste, hecha realidad." },
    { icon: "🍽️", title: "Banquete gourmet incluido", desc: "Menú diseñado con los mejores chefs del grupo. Opciones para todo tipo de dieta y preferencia culinaria." },
    { icon: "🥂", title: "Open bar premium", desc: "Bebidas nacionales e importadas durante toda la celebración. Tus invitados no van a querer irse." },
    { icon: "🏨", title: "Habitaciones para invitados", desc: "Tarifas especiales para el grupo de invitados. Todos bajo el mismo techo en el mejor hotel." },
    { icon: "📸", title: "Coordinador dedicado", desc: "Un coordinador exclusivo de bodas desde el primer contacto hasta el último momento de tu celebración." },
    { icon: "💑", title: "Luna de miel incluida", desc: "Noche especial con decoración, detalles y sorpresas de bienvenida para la pareja. Sin costo adicional." },
  ],

  emotional: {
    headline: "El día más importante de tu vida merece el escenario más impresionante.",
    body: "Xcaret no es un hotel de bodas más. Es una experiencia que tus invitados van a recordar por décadas. La selva, el mar, los cenotes y la cultura maya como fondo de tus votos.",
    highlight: "Mientras tú te casas, tus invitados ya están de vacaciones. Eso es lo que hace diferente a una boda en Xcaret.",
  },

  features: [
    { icon: "🌺", label: "Decoración tropical" },
    { icon: "🎻", label: "Música en vivo" },
    { icon: "🕯️", label: "Ceremonia nocturna" },
    { icon: "🧑‍🍳", label: "Chef privado" },
    { icon: "📷", label: "Fotógrafo local" },
    { icon: "🚁", label: "Vistas espectaculares" },
    { icon: "🌙", label: "Fiesta hasta el amanecer" },
    { icon: "🎂", label: "Pastel personalizado" },
  ],

  testimonials: [
    { quote: "Organizamos nuestra boda en Xcaret con 40 invitados. Fue perfecto. El coordinador estuvo disponible en todo momento y los invitados no paraban de agradecernos.", author: "Sofía y Andrés", origin: "CDMX · Boda 2025" },
    { quote: "Nunca pensé que organizarlo sería tan fácil. Fenix Traveler manejó todo desde las habitaciones de invitados hasta el banquete. Increíble.", author: "Valeria y Óscar", origin: "Guadalajara · Diciembre 2025" },
    { quote: "El entorno es impresionante. La ceremonia al atardecer con el parque de fondo fue algo que ninguna foto puede capturar completamente.", author: "Fernanda y Javier", origin: "Monterrey · 2024" },
  ],

  urgency: {
    headline: "📅 Las fechas más bonitas se van primero",
    items: [
      "Diciembre y febrero son los meses más solicitados — disponibilidad muy limitada",
      "Los paquetes con ceremonia al atardecer requieren reserva con 6+ meses de anticipación",
      "Grupos de más de 30 invitados: disponibilidad especial con descuento grupal",
      "Cotización sin compromiso disponible hoy mismo por WhatsApp",
    ],
    ctaLabel: "Verificar disponibilidad para mi boda",
    waMessage: "Hola! Quiero verificar disponibilidad para mi boda en Hotel Xcaret México. ¿Cuándo tienen fechas y cuál sería el costo aproximado?",
  },

  finalCta: {
    headline: "El primer paso es el más fácil: escríbenos.",
    sub: "Te enviamos una propuesta personalizada con opciones y precios en menos de 24 horas. Sin presión, sin compromiso.",
    ctaLabel: "Cotizar mi boda en Xcaret",
    waMessage: "Hola! Quiero cotizar mi boda en Hotel Xcaret México. Somos [número de invitados] personas y tenemos en mente [fecha aproximada].",
  },
};

export default function XcaretBodas() {
  return <XcaretLanding config={config} slug="xcaret-bodas" />;
}
