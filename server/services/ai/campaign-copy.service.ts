import { callClaude, parseJsonSafe } from "./claude";

export interface CampaignCopyInput {
  brandCode: string;
  brandName: string;
  channel: "email" | "whatsapp";
  topic: string;
  audienceSegment: string;
  tone?: string;
}

export interface CampaignCopy {
  subject?: string;
  body: string;
}

export async function generateCampaignCopy(input: CampaignCopyInput): Promise<CampaignCopy | null> {
  const isFenix = input.brandCode === "fenix";
  const tone = input.tone || (isFenix ? "premium, sofisticado y exclusivo" : "cálido, inclusivo y celebratorio (evita lenguaje binario)");

  const maxLength = input.channel === "whatsapp" ? "máximo 3 párrafos cortos (WhatsApp)" : "máximo 400 palabras con HTML básico (email)";

  const system = `Eres un experto en marketing para ${input.brandName}, agencia de viajes. Tono: ${tone}.
Genera copy de campaña en español mexicano. ${maxLength}.
Responde SOLO en JSON: { "subject": "asunto del email (omite si es WhatsApp)", "body": "contenido listo para enviar" }`;

  const userMsg = `Canal: ${input.channel}
Tema de la campaña: ${input.topic}
Audiencia: ${input.audienceSegment}
Marca: ${input.brandName}`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userMsg }],
    maxTokens: 800,
    temperature: 0.8,
  });

  return parseJsonSafe<CampaignCopy>(raw);
}
