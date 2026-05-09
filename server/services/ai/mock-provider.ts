import type { AIProvider, AICompletionOptions, AICompletionResult } from "./provider";

const MOCK_RESPONSES: Record<string, string> = {
  greeting: JSON.stringify({
    intent: "greeting",
    confidence: 0.9,
    suggestedAction: "respond",
    suggestedResponse: "¡Hola! Bienvenido. ¿En qué destino estás interesado? Tenemos las mejores opciones en playa, ciudades y aventura."
  }),
  price_inquiry: JSON.stringify({
    intent: "price_inquiry",
    confidence: 0.8,
    suggestedAction: "create_lead",
    suggestedResponse: "¡Con gusto te ayudo con precios! ¿Qué destino te interesa y para cuántas personas?"
  }),
  booking: JSON.stringify({
    intent: "booking",
    confidence: 0.85,
    suggestedAction: "escalate_agent",
    suggestedResponse: "¡Perfecto! Un asesor te contactará en breve para finalizar tu reservación."
  }),
  general: JSON.stringify({
    intent: "general",
    confidence: 0.5,
    suggestedAction: "respond",
    suggestedResponse: "¡Gracias por contactarnos! ¿En qué puedo ayudarte hoy?"
  }),
};

function detectIntent(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("hola") || lower.includes("buenos") || lower.includes("buenas")) return "greeting";
  if (lower.includes("precio") || lower.includes("cuanto") || lower.includes("costo")) return "price_inquiry";
  if (lower.includes("reservar") || lower.includes("apartar") || lower.includes("comprar")) return "booking";
  if (lower.includes("disponib")) return "price_inquiry";
  if (lower.includes("queja") || lower.includes("problema")) return "booking";
  return "general";
}

export class MockAIProvider implements AIProvider {
  name = "mock";

  complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const lastUserMessage = [...options.messages].reverse().find(m => m.role === "user");
    const userText = lastUserMessage?.content || "";

    const systemPrompt = options.messages.find(m => m.role === "system")?.content || "";
    const isJsonMode = options.jsonMode || systemPrompt.includes("JSON");

    let content: string;
    if (isJsonMode) {
      const intent = detectIntent(userText);
      content = MOCK_RESPONSES[intent] || MOCK_RESPONSES.general;
    } else {
      const intent = detectIntent(userText);
      const parsed = JSON.parse(MOCK_RESPONSES[intent] || MOCK_RESPONSES.general);
      content = parsed.suggestedResponse;
    }

    return Promise.resolve({
      content,
      model: "mock-v1",
      provider: "mock",
      tokensUsed: 0,
      isMock: true,
    });
  }

  isAvailable(): boolean {
    return true;
  }
}
