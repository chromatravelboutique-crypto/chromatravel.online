import { XcaretLanding, type XcaretLandingConfig } from "@/components/xcaret-landing-template";
import heroImg from "@assets/generated_images/beach_proposal_romantic_setup.png";

const config: XcaretLandingConfig = {
  brand: "chroma",
  metaTitle: "Boda Simbólica en Xcaret Arte — LGBT+ | Chroma Travel",
  metaDescription: "Celebra tu boda simbólica o renovación de votos en Hotel Xcaret Arte. Ceremonia personalizada, banquete de autor y luna de miel en el resort más lujoso de México.",
  keywords: "boda simbólica Xcaret LGBT, boda gay México Xcaret Arte, ceremonia LGBT Riviera Maya, boda de chocolate Xcaret",
  waNumber: "524434044104",

  hero: {
    eyebrow: "Chroma Travel · Bodas Simbólicas LGBT+",
    headline: "Tu amor merece una celebración sin restricciones.",
    sub: "Boda simbólica, renovación de votos, o simplemente la fiesta que quieren darse — en Hotel Xcaret Arte, solo adultos, con gastronomía de autor y libertad total. Sin papeleos, sin límites.",
    ctaLabel: "Quiero cotizar mi boda simbólica en Xcaret",
    waMessage: "Hola! Me interesa organizar una boda simbólica o celebración de pareja en Hotel Xcaret Arte. ¿Qué opciones tienen?",
    badge: "🌈💍 Boda Simbólica · Sin Restricciones",
    bgClass: "bg-gradient-to-br from-pink-900 via-purple-900 to-emerald-900",
    bgImage: heroImg,
  },

  benefits: [
    { icon: "💍", title: "Ceremonia totalmente personalizada", desc: "No hay un formato obligatorio. La ceremonia se diseña contigo: votos, música, decoración, ritual. Tu historia, tus reglas." },
    { icon: "🎂", title: "Sin papeleos ni requisitos legales", desc: "La boda simbólica es solo celebración. Sin trámites, sin testigos obligatorios, sin restricciones de ningún tipo." },
    { icon: "🍽️", title: "Banquete gourmet de autor", desc: "Menú diseñado por chefs del grupo Xcaret en cualquiera de sus 12 restaurantes o en espacio privado exclusivo." },
    { icon: "🌅", title: "Ceremonia al atardecer", desc: "El mejor horario: la luz de la tarde sobre el caribe mexicano, la selva como fondo, la magia que no se puede fabricar." },
    { icon: "💑", title: "Luna de miel incluida", desc: "Suite con detalles especiales para la pareja, cena romántica privada y spa para dos en su primera noche como celebrantes." },
    { icon: "🌈", title: "Espacio 100% LGBT+ safe", desc: "Todo el personal capacitado, todos los espacios inclusivos. Aquí no hay ningún 'pero'. Solo celebración." },
  ],

  emotional: {
    headline: "El amor que construyeron merece ser celebrado como ellos quieren, no como dictan los formularios.",
    body: "Una boda simbólica en Xcaret Arte no es un sustituto de nada — es una elección. La de celebrar su amor en el lugar más impresionante de México, con las personas que importan, sin distracciones, sin juzgados, sin protocolos que no son suyos.",
    highlight: "Llámalo boda de chocolate, renovación de votos, celebración de amor, o como quieran. Lo que importa es que es suyo.",
  },

  features: [
    { icon: "🌺", label: "Decoración floral" },
    { icon: "🎵", label: "Música personalizada" },
    { icon: "📷", label: "Fotógrafo profesional" },
    { icon: "🧁", label: "Pastel de diseño" },
    { icon: "🛁", label: "Suite de bodas" },
    { icon: "🍾", label: "Champagne de lujo" },
    { icon: "💆", label: "Spa para dos" },
    { icon: "🕯️", label: "Cena íntima" },
  ],

  testimonials: [
    { quote: "Llevábamos 10 años juntos y quisimos celebrarlo como se merecía. La boda simbólica en Xcaret Arte fue el mejor regalo que nos pudimos dar.", author: "Andrés y Felipe", origin: "CDMX · Aniversario 2025" },
    { quote: "No queríamos el protocolo de una boda civil. Queríamos celebrar nuestro amor con nuestros amigos más cercanos. Xcaret Arte fue perfecto.", author: "Valentina y Camila", origin: "Guadalajara · 2024" },
    { quote: "Chroma Travel entendió exactamente lo que buscábamos. Organizaron todo en detalle y el día fue mágico. No hay palabras para describir cómo nos sentimos.", author: "Roberto y Sergio", origin: "Monterrey · 2025" },
  ],

  urgency: {
    headline: "💍 Las fechas más especiales se reservan con anticipación",
    items: [
      "Solsticios, equinoccios y fechas especiales: reserva con 4+ meses de anticipación",
      "El espacio de ceremonia al atardecer tiene capacidad limitada",
      "Paquetes con fotógrafo y spa incluido: disponibilidad sujeta a fechas",
      "Grupos de invitados de 10+ personas requieren coordinación especial",
    ],
    ctaLabel: "Consultar fechas disponibles para mi ceremonia",
    waMessage: "Hola! Quiero consultar fechas disponibles para una boda simbólica en Xcaret Arte. Somos una pareja LGBT+.",
  },

  finalCta: {
    headline: "Su amor ya es real. Solo falta la celebración.",
    sub: "Escríbenos con la fecha aproximada y el número de invitados. Les enviamos una propuesta personalizada en menos de 24 horas.",
    ctaLabel: "Organizar mi boda simbólica en Xcaret",
    waMessage: "Hola! Queremos organizar nuestra boda simbólica en Hotel Xcaret Arte. Somos una pareja LGBT+ y buscamos algo especial.",
  },
};

export default function XcaretBodaSimbolica() {
  return <XcaretLanding config={config} slug="xcaret-boda-simbolica" />;
}
