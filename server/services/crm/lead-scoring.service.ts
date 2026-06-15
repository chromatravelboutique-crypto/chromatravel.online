import { callClaude, parseJsonSafe } from "../ai/claude";

export function scoreLeadData(data: {
  phone?: string | null;
  destination?: string | null;
  travelDates?: string | null;
  message?: string | null;
  source?: string | null;
}): { points: number; category: "HOT" | "WARM" | "COLD" } {
  let points = 0;
  if (data.phone) points += 25;
  if (data.destination) points += 20;
  if (data.travelDates) points += 20;
  if (data.message && data.message.length > 10) points += 15;
  if (data.source === "whatsapp" || data.source === "referral") points += 10;
  if (data.source === "widget-cotizador" || data.source === "exit-intent") points += 5;
  points += 10;
  let category: "HOT" | "WARM" | "COLD" = "COLD";
  if (points >= 70) category = "HOT";
  else if (points >= 40) category = "WARM";
  return { points, category };
}

interface AIScoreResult {
  score: number;
  reason: string;
  nextAction: string;
}

export async function aiScoreLead(
  leadData: {
    name?: string;
    destination?: string;
    travelDates?: string;
    message?: string;
    phone?: string;
    source?: string;
  },
  conversationHistory: { role: string; content: string }[] = []
): Promise<AIScoreResult | null> {
  const historyText = conversationHistory
    .slice(-6)
    .map((h) => `${h.role === "user" ? "Cliente" : "Asesor"}: ${h.content}`)
    .join("\n");

  const system = `Analiza este lead de agencia de viajes y asigna un score del 1-100.
Considera: urgencia de viaje, claridad de destino, presupuesto mencionado, número de personas, engagement en conversación, señales de compra.
Responde SOLO en JSON: { "score": number, "reason": string, "nextAction": string }`;

  const userMsg = `Lead:
- Nombre: ${leadData.name || "desconocido"}
- Destino: ${leadData.destination || "no especificado"}
- Fechas: ${leadData.travelDates || "no especificadas"}
- Mensaje: ${leadData.message || "sin mensaje"}
- Fuente: ${leadData.source || "web"}
- Teléfono: ${leadData.phone ? "sí" : "no"}
${historyText ? `\nConversación reciente:\n${historyText}` : ""}`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userMsg }],
    maxTokens: 300,
  });

  return parseJsonSafe<AIScoreResult>(raw);
}
