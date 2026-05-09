import { aiService } from "../ai";
import type { AIMessage } from "../ai";

export interface AIEvent {
  type: 
    | "customer_created"
    | "booking_confirmed"
    | "booking_cancelled"
    | "payment_received"
    | "loyalty_level_up"
    | "birthday_upcoming"
    | "anniversary_upcoming"
    | "campaign_started"
    | "lead_created"
    | "referral_completed";
  data: Record<string, any>;
  brandId?: string;
  userId?: string;
  timestamp: Date;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  channel?: "whatsapp" | "email" | "sms";
  metadata?: Record<string, any>;
  error?: string;
  isMock?: boolean;
}

const EVENT_PROMPTS: Record<string, string> = {
  lead_created: "Un nuevo lead ha sido creado. Genera un mensaje de bienvenida corto y profesional en español para enviarlo por el canal indicado. Incluye mención al destino si está disponible.",
  booking_confirmed: "Una reservación ha sido confirmada. Genera un mensaje de confirmación entusiasta en español con los detalles del viaje.",
  birthday_upcoming: "Se acerca el cumpleaños de un cliente. Genera un mensaje de felicitación personalizado en español con una oferta especial de viaje.",
  loyalty_level_up: "Un cliente ha subido de nivel en el programa de lealtad. Genera un mensaje de felicitación en español mencionando sus nuevos beneficios.",
  payment_received: "Se ha recibido un pago. Genera un mensaje breve de confirmación de pago en español.",
};

class AIAssistantService {
  isEnabled(): boolean {
    return !aiService.isMock();
  }

  getStatus() {
    return aiService.getStatus();
  }

  async processEvent(event: AIEvent): Promise<AIResponse> {
    const promptTemplate = EVENT_PROMPTS[event.type];
    if (!promptTemplate) {
      return { success: false, error: `No template for event type: ${event.type}` };
    }

    const messages: AIMessage[] = [
      {
        role: "system",
        content: "Eres un asistente de CRM para una agencia de viajes premium. Genera mensajes profesionales, cálidos y en español mexicano. Responde SOLO con el texto del mensaje, sin formato JSON.",
      },
      {
        role: "user",
        content: `${promptTemplate}\n\nDatos del evento:\n${JSON.stringify(event.data, null, 2)}`,
      },
    ];

    try {
      const result = await aiService.complete({ messages, maxTokens: 500 });
      return {
        success: true,
        content: result.content,
        metadata: { provider: result.provider, model: result.model },
        isMock: result.isMock,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async generateMessage(
    prompt: string,
    channel: "whatsapp" | "email" | "sms"
  ): Promise<AIResponse> {
    const maxLength = channel === "sms" ? 160 : channel === "whatsapp" ? 500 : 2000;

    const messages: AIMessage[] = [
      {
        role: "system",
        content: `Eres un asistente de marketing para una agencia de viajes. Genera mensajes para el canal ${channel}. Máximo ${maxLength} caracteres. Español mexicano profesional. Responde SOLO con el texto del mensaje.`,
      },
      { role: "user", content: prompt },
    ];

    try {
      const result = await aiService.complete({ messages, maxTokens: 300 });
      return {
        success: true,
        content: result.content,
        channel,
        metadata: { provider: result.provider, model: result.model },
        isMock: result.isMock,
      };
    } catch (error: any) {
      return { success: false, error: error.message, channel };
    }
  }
}

export const aiAssistant = new AIAssistantService();
export default aiAssistant;
