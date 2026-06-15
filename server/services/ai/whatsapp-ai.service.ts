import { callClaude } from "./claude";

export interface BrandPersonality {
  nombre: string;
  saludo: string;
  cierre: string;
  tono: string;
  keywordsUsar: string[];
  keywordsEvitar: string[];
}

const PERSONALITIES: Record<string, BrandPersonality> = {
  fenix: {
    nombre: "Fénix Traveler",
    saludo: "Bienvenido a Fénix Traveler ✨ Soy tu asesor de viajes de lujo.",
    cierre: "Estamos para hacer realidad el viaje de tus sueños 🦅",
    tono: "premium, sofisticado y personalizado",
    keywordsUsar: ["exclusivo", "premium", "personalizado", "experiencia única", "seleccionado para ti"],
    keywordsEvitar: ["genérico", "económico", "barato", "oferta", "descuento"],
  },
  chroma: {
    nombre: "Chroma Travel",
    saludo: "¡Hola! Bienvenidx a Chroma Travel 🌈 Tu agencia de viajes LGBT+ friendly.",
    cierre: "Viaja con quien amas, en los espacios que te celebran 💜",
    tono: "cálido, inclusivo, celebratorio y seguro",
    keywordsUsar: ["inclusivo", "safe space", "celebrar", "libre", "auténtico", "friendly"],
    keywordsEvitar: ["señoras y señores", "damas y caballeros", "él/ella exclusivo"],
  },
};

export function getBrandPersonality(brandCode: string): BrandPersonality {
  return PERSONALITIES[brandCode] || PERSONALITIES.chroma;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LeadContext {
  destino?: string;
  fechas?: string;
  personas?: number;
  presupuesto?: string;
  nombre?: string;
}

export async function generateWhatsAppResponse(
  userMessage: string,
  leadContext: LeadContext,
  brandCode: string,
  history: ConversationTurn[],
  domain?: string
): Promise<string | null> {
  const personality = getBrandPersonality(brandCode);
  const siteUrl = domain ? `https://www.${domain}/bloqueos` : "https://www.chromatravel.online/bloqueos";

  const contextLines: string[] = [];
  if (leadContext.nombre)      contextLines.push(`Nombre del cliente: ${leadContext.nombre}`);
  if (leadContext.destino)     contextLines.push(`Destino de interés: ${leadContext.destino}`);
  if (leadContext.fechas)      contextLines.push(`Fechas: ${leadContext.fechas}`);
  if (leadContext.personas)    contextLines.push(`Número de viajeros: ${leadContext.personas}`);
  if (leadContext.presupuesto) contextLines.push(`Presupuesto: ${leadContext.presupuesto}`);

  const system = `Eres un asesor de ${personality.nombre}. Personalidad: ${personality.tono}.
${contextLines.length ? `Perfil del cliente:\n${contextLines.join("\n")}` : ""}

Reglas:
- Responde de forma natural y breve (máximo 3 párrafos cortos).
- Usa español mexicano amigable.
- Usa estas palabras cuando aplique: ${personality.keywordsUsar.join(", ")}.
- Evita: ${personality.keywordsEvitar.join(", ")}.
- Si preguntan por precios, di que le envías opciones personalizadas.
- Si quieren reservar, dirige a: ${siteUrl}
- NUNCA inventes precios específicos que no estén en el contexto.
- Termina con: "${personality.cierre}"`;

  const recentHistory = history.slice(-8);
  const messages = [
    ...recentHistory,
    { role: "user" as const, content: userMessage },
  ];

  return callClaude({ system, messages, maxTokens: 600, temperature: 0.8 });
}
