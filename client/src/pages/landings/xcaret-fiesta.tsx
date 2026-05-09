import { XcaretLanding, type XcaretLandingConfig } from "@/components/xcaret-landing-template";
import heroImg from "@assets/generated_images/beach_club_pool_party.png";

const config: XcaretLandingConfig = {
  brand: "chroma",
  metaTitle: "Xcaret Arte — Escapada con Amigos LGBT+ | Chroma Travel",
  metaDescription: "La escapada con amigos que no van a olvidar: Hotel Xcaret Arte solo adultos. Gastronomía de autor, fiestas en la playa, y libertad total. Sin filtros.",
  keywords: "Xcaret Arte fiesta amigos LGBT, escapada gay Riviera Maya, viaje amigos solo adultos México, Xcaret Arte grupos",
  waNumber: "524434044104",

  hero: {
    eyebrow: "Chroma Travel · Escapadas con Amigos",
    headline: "La escapada que llevan planeando hace meses. Ya es hora.",
    sub: "Hotel Xcaret Arte solo adultos: el lugar donde las reglas las ponen ustedes. Gastronomía de autor, albercas espectaculares, playa y la noche que quieran. Sin filtros.",
    ctaLabel: "Armar la escapada con mi grupo",
    waMessage: "Hola! Somos un grupo de amigos LGBT+ y queremos organizar una escapada en Hotel Xcaret Arte. ¿Qué opciones tienen para grupos?",
    badge: "🎉 Grupos LGBT+ · Solo Adultos",
    bgClass: "bg-gradient-to-br from-fuchsia-900 via-purple-900 to-teal-900",
    bgImage: heroImg,
  },

  benefits: [
    { icon: "🎉", title: "Solo adultos, sin límites", desc: "No hay que bajar la voz, no hay que ser discretos. Xcaret Arte es el espacio donde tu grupo puede ser exactamente como es." },
    { icon: "🍹", title: "Open bar premium incluido", desc: "Bebidas nacionales e importadas sin tope. Cocteles en la alberca, en la playa o en cualquiera de los 12 restaurantes." },
    { icon: "🏊", title: "Albercas temáticas de día", desc: "Múltiples albercas con ambiente, música y vista. El punto de reunión perfecto para tu grupo antes de la noche." },
    { icon: "🌴", title: "Playa privada adultos", desc: "Camastros con sombra, servicio de bebidas en la arena y el Mar Caribe como fondo. El lujo tiene este nivel." },
    { icon: "🎨", title: "Experiencias de arte y cultura", desc: "Visitas a galerías, talleres creativos y shows nocturnos que van más allá de lo que esperas de un resort." },
    { icon: "💰", title: "Tarifas de grupo exclusivas", desc: "Grupos de 4+ habitaciones obtienen tarifas especiales y ventajas adicionales. Más amigos, mejor precio." },
  ],

  emotional: {
    headline: "Porque hay trips que te cambian y trips que te definen.",
    body: "La escapada con amigos en Xcaret Arte no es solo un viaje. Es el fin de semana (o semana) del que van a hablar por años. Donde los chats de grupo dejan de ser planes y se convierten en fotos y recuerdos.",
    highlight: "Aquí no tienes que explicar quién eres. Solo tienes que aparecer. El resto lo hace Xcaret Arte.",
  },

  features: [
    { icon: "🎤", label: "Shows en vivo" },
    { icon: "🍸", label: "Cocteles de autor" },
    { icon: "🌊", label: "Snorkel y cenotes" },
    { icon: "🧖", label: "Spa grupal" },
    { icon: "📸", label: "Photoworthy views" },
    { icon: "🌙", label: "Vida nocturna" },
    { icon: "🎨", label: "Arte urbano" },
    { icon: "🛶", label: "Aventura en grupo" },
  ],

  testimonials: [
    { quote: "Fuimos 8 amigos y fue el mejor viaje que hemos tenido. La organización fue perfecta, Chroma Travel nos consiguió cuartos juntos y el precio fue muy competitivo.", author: "Grupo de CDMX", origin: "8 personas · Verano 2025" },
    { quote: "El hotel es una obra de arte. Cada área para fotos, la comida deliciosa, los cocteles increíbles. Nuestro grupo habla de ese viaje hasta hoy.", author: "Las Chicas del Norte", origin: "Monterrey · 6 personas" },
    { quote: "Nunca me había sentido tan libre de fiesta en un resort. Todo el personal muy amable, el ambiente increíble. Ya estamos planeando la segunda vuelta.", author: "Grupo GDL Pride", origin: "Guadalajara · 2024" },
  ],

  urgency: {
    headline: "⚡ Los grupos más grandes se quedan sin espacio primero",
    items: [
      "Habitaciones contiguas para grupos: reservar con 3+ meses de anticipación",
      "Julio y agosto: temporada alta, cupo muy reducido para grupos",
      "Paquetes con actividades grupales (spa, tours, cenas privadas): disponibilidad limitada",
      "Precio de grupo aplica con mínimo 4 habitaciones confirmadas",
    ],
    ctaLabel: "Armar cotización para mi grupo",
    waMessage: "Hola! Somos un grupo de amigos LGBT+ y queremos escaparnos a Xcaret Arte. Somos aproximadamente [número] personas.",
  },

  finalCta: {
    headline: "¿A qué esperan? El chat de grupo lleva semanas en esto.",
    sub: "Mándanos el número de personas y las fechas aproximadas. Les respondemos con opciones y precios reales en minutos.",
    ctaLabel: "Cotizar escapada grupal en Xcaret Arte",
    waMessage: "Hola! Queremos cotizar una escapada con amigos en Hotel Xcaret Arte. Somos un grupo LGBT+ de [número] personas.",
  },
};

export default function XcaretFiesta() {
  return <XcaretLanding config={config} slug="xcaret-fiesta" />;
}
