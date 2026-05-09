import { getDb } from "../../db";
import {
  whatsappConversations,
  whatsappMessages,
  leads,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { aiService } from "../ai";
import type { AIMessage } from "../ai";

function getDatabase() {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

interface MessageAnalysis {
  intent: "price_inquiry" | "availability" | "booking" | "destination_info" | "complaint" | "general" | "greeting";
  destination?: string;
  dates?: string;
  pax?: number;
  budget?: string;
  confidence: number;
  suggestedAction: "create_lead" | "generate_quote" | "escalate_agent" | "provide_info" | "respond";
  suggestedResponse: string;
}

interface ConversationContext {
  intent?: string;
  destination?: string;
  dates?: string;
  pax?: number;
  budget?: string;
  history: { role: string; content: string }[];
}

const SALES_SYSTEM_PROMPT = `Eres un asistente de ventas de una agencia de viajes premium. Tu objetivo es:
1. Identificar la intención del cliente (precio, disponibilidad, reservar, información, queja)
2. Extraer información relevante (destino, fechas, número de personas, presupuesto)
3. Generar respuestas útiles y amigables en español
4. Crear oportunidades de venta

Responde SIEMPRE en español mexicano profesional pero amigable.
Si detectas una oportunidad de venta clara, sugiere crear un lead.
Si el cliente quiere reservar, escala a un agente humano.

IMPORTANTE: Responde en formato JSON con esta estructura:
{
  "intent": "price_inquiry|availability|booking|destination_info|complaint|general|greeting",
  "destination": "nombre del destino si se menciona",
  "dates": "fechas si se mencionan",
  "pax": número de personas si se menciona,
  "budget": "presupuesto si se menciona",
  "confidence": 0.0-1.0,
  "suggestedAction": "create_lead|generate_quote|escalate_agent|provide_info|respond",
  "suggestedResponse": "Tu respuesta amigable aquí"
}`;

class WhatsAppSalesService {
  async handleIncomingMessage(
    phoneNumber: string,
    message: string,
    brandId: string
  ) {
    const db = getDatabase();
    
    let conversation = await this.getOrCreateConversation(phoneNumber, brandId);
    
    await db.insert(whatsappMessages).values({
      conversationId: conversation.id,
      direction: "inbound",
      messageType: "text",
      content: message,
      status: "received",
    });

    const context = (conversation.context as ConversationContext) || { history: [] };
    context.history = context.history || [];
    context.history.push({ role: "user", content: message });
    
    if (context.history.length > 10) {
      context.history = context.history.slice(-10);
    }

    const analysis = await this.analyzeMessage(message, context);
    
    if (analysis.destination) context.destination = analysis.destination;
    if (analysis.dates) context.dates = analysis.dates;
    if (analysis.pax) context.pax = analysis.pax;
    if (analysis.budget) context.budget = analysis.budget;
    context.intent = analysis.intent;

    await db
      .update(whatsappConversations)
      .set({
        context,
        lastMessage: message,
        lastMessageAt: new Date(),
      })
      .where(eq(whatsappConversations.id, conversation.id));

    if (analysis.suggestedAction === "create_lead" && analysis.destination) {
      await this.createLeadFromConversation(conversation.id, brandId, phoneNumber, context);
    }

    if (analysis.suggestedAction === "escalate_agent") {
      await db
        .update(whatsappConversations)
        .set({ status: "waiting_agent" })
        .where(eq(whatsappConversations.id, conversation.id));
    }

    await db.insert(whatsappMessages).values({
      conversationId: conversation.id,
      direction: "outbound",
      messageType: "text",
      content: analysis.suggestedResponse,
      status: "sent",
      aiAnalysis: analysis,
    });

    context.history.push({ role: "assistant", content: analysis.suggestedResponse });
    await db
      .update(whatsappConversations)
      .set({ context })
      .where(eq(whatsappConversations.id, conversation.id));

    console.log(`[WhatsApp Sales] Processed message from ${phoneNumber}: ${analysis.intent} (provider: ${aiService.getProviderName()})`);
    
    return {
      response: analysis.suggestedResponse,
      analysis,
      conversationId: conversation.id,
    };
  }

  private async getOrCreateConversation(phoneNumber: string, brandId: string) {
    const db = getDatabase();
    
    const [existing] = await db
      .select()
      .from(whatsappConversations)
      .where(
        and(
          eq(whatsappConversations.phoneNumber, phoneNumber),
          eq(whatsappConversations.brandId, brandId),
          eq(whatsappConversations.status, "active")
        )
      );

    if (existing) return existing;

    const [conversation] = await db
      .insert(whatsappConversations)
      .values({
        brandId,
        phoneNumber,
        status: "active",
        context: { history: [] },
      })
      .returning();

    return conversation;
  }

  private async analyzeMessage(
    message: string, 
    context: ConversationContext
  ): Promise<MessageAnalysis> {
    try {
      const contextSummary: string[] = [];
      if (context.destination) contextSummary.push(`Destino: ${context.destination}`);
      if (context.dates) contextSummary.push(`Fechas: ${context.dates}`);
      if (context.pax) contextSummary.push(`Personas: ${context.pax}`);
      if (context.budget) contextSummary.push(`Presupuesto: ${context.budget}`);

      const systemContent = SALES_SYSTEM_PROMPT + (contextSummary.length > 0 
        ? `\n\nContexto de la conversación:\n${contextSummary.join("\n")}` 
        : "");

      const messages: AIMessage[] = [
        { role: "system", content: systemContent },
      ];

      for (const h of context.history.slice(-6)) {
        messages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: h.content,
        });
      }

      if (messages.filter(m => m.role === "user").length === 0) {
        messages.push({ role: "user", content: message });
      }

      const result = await aiService.complete({
        messages,
        maxTokens: 1024,
        jsonMode: true,
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as MessageAnalysis;
      }

      return this.getDefaultAnalysis(message);
    } catch (error) {
      console.error("[WhatsApp Sales] AI analysis error:", error);
      return this.getDefaultAnalysis(message);
    }
  }

  private getDefaultAnalysis(message: string): MessageAnalysis {
    const lowerMessage = message.toLowerCase();
    
    let intent: MessageAnalysis["intent"] = "general";
    let suggestedAction: MessageAnalysis["suggestedAction"] = "respond";
    
    if (lowerMessage.includes("hola") || lowerMessage.includes("buenos") || lowerMessage.includes("buenas")) {
      intent = "greeting";
    } else if (lowerMessage.includes("precio") || lowerMessage.includes("cuanto") || lowerMessage.includes("costo")) {
      intent = "price_inquiry";
      suggestedAction = "create_lead";
    } else if (lowerMessage.includes("disponib") || lowerMessage.includes("hay lugar")) {
      intent = "availability";
    } else if (lowerMessage.includes("reservar") || lowerMessage.includes("apartar") || lowerMessage.includes("comprar")) {
      intent = "booking";
      suggestedAction = "escalate_agent";
    } else if (lowerMessage.includes("queja") || lowerMessage.includes("problema") || lowerMessage.includes("mal")) {
      intent = "complaint";
      suggestedAction = "escalate_agent";
    }

    const destinations = ["cancun", "riviera maya", "los cabos", "puerto vallarta", "playa del carmen", "tulum", "ixtapa", "barcelona", "amsterdam"];
    let destination = undefined;
    for (const dest of destinations) {
      if (lowerMessage.includes(dest)) {
        destination = dest.charAt(0).toUpperCase() + dest.slice(1);
        break;
      }
    }

    return {
      intent,
      destination,
      confidence: 0.6,
      suggestedAction,
      suggestedResponse: this.getDefaultResponse(intent, destination),
    };
  }

  private getDefaultResponse(intent: string, destination?: string): string {
    const responses: Record<string, string> = {
      greeting: "Bienvenido. ¿En qué destino estás interesado? Tenemos las mejores opciones en playa, ciudades y aventura.",
      price_inquiry: destination 
        ? `Excelente elección. ${destination} es un destino increíble. Para darte el mejor precio, ¿me podrías decir las fechas aproximadas y cuántas personas viajan?`
        : "Con gusto te ayudo con precios. ¿Qué destino te interesa y para cuántas personas?",
      availability: "Permíteme verificar la disponibilidad. ¿Podrías darme las fechas exactas que tienes en mente?",
      booking: "Perfecto. Un asesor te contactará en breve para finalizar tu reservación. ¿Tienes alguna preferencia especial?",
      complaint: "Lamento mucho el inconveniente. Un supervisor te contactará en los próximos minutos para resolver tu situación.",
      destination_info: destination
        ? `${destination} es un destino espectacular. ¿Te gustaría conocer nuestros paquetes especiales?`
        : "Tenemos opciones increíbles en playa y ciudad. ¿Qué tipo de viaje buscas?",
      general: "Gracias por contactarnos. ¿En qué puedo ayudarte hoy?",
    };

    return responses[intent] || responses.general;
  }

  private async createLeadFromConversation(
    conversationId: string,
    brandId: string,
    phoneNumber: string,
    context: ConversationContext
  ) {
    const db = getDatabase();
    
    const [existingLead] = await db
      .select()
      .from(leads)
      .where(eq(leads.phone, phoneNumber));

    if (existingLead) {
      await db
        .update(whatsappConversations)
        .set({ leadId: existingLead.id })
        .where(eq(whatsappConversations.id, conversationId));
      return existingLead;
    }

    const [lead] = await db.insert(leads).values({
      brandId,
      name: `WhatsApp ${phoneNumber}`,
      email: `wa_${phoneNumber.replace(/\D/g, "")}@placeholder.com`,
      phone: phoneNumber,
      destination: context.destination,
      travelDates: context.dates,
      source: "whatsapp_bot",
      status: "new",
    }).returning();

    await db
      .update(whatsappConversations)
      .set({ leadId: lead.id })
      .where(eq(whatsappConversations.id, conversationId));

    console.log(`[WhatsApp Sales] Created lead ${lead.id} from conversation`);
    return lead;
  }

  async getConversation(conversationId: string) {
    const db = getDatabase();
    const [conversation] = await db
      .select()
      .from(whatsappConversations)
      .where(eq(whatsappConversations.id, conversationId));
    return conversation;
  }

  async getConversationMessages(conversationId: string) {
    const db = getDatabase();
    return await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.conversationId, conversationId))
      .orderBy(whatsappMessages.createdAt);
  }

  async getActiveConversations(brandId: string) {
    const db = getDatabase();
    return await db
      .select()
      .from(whatsappConversations)
      .where(
        and(
          eq(whatsappConversations.brandId, brandId),
          eq(whatsappConversations.status, "active")
        )
      )
      .orderBy(desc(whatsappConversations.lastMessageAt));
  }
}

export const whatsappSalesService = new WhatsAppSalesService();
export default whatsappSalesService;
