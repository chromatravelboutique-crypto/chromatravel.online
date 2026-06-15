import { callClaude, parseJsonSafe } from "./claude";

export interface LeadProfile {
  destino?: string;
  presupuesto?: string;
  checkIn?: string;
  checkOut?: string;
  personas?: number;
}

export interface Bloqueo {
  id: number;
  hotel: string;
  tipo_habitacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  tarifa_doble: number;
  habitaciones_disponibles: number;
}

export interface SmartRecommendation {
  blockId: number;
  hotelName: string;
  tipoHabitacion: string;
  reason: string;
  matchScore: number;
  highlights: string[];
  tarifaDoble: number;
  fechaInicio: string;
  habitacionesDisponibles: number;
}

interface AIReco {
  blockId: number;
  hotelName: string;
  reason: string;
  matchScore: number;
  highlights: string[];
}

export async function generateSmartQuote(
  brandName: string,
  lead: LeadProfile,
  blocks: Bloqueo[]
): Promise<SmartRecommendation[]> {
  if (blocks.length === 0) return [];

  const inventoryText = blocks
    .slice(0, 40) // limit context size
    .map(
      (b) =>
        `ID:${b.id} | ${b.hotel} | ${b.tipo_habitacion} | Check-in:${b.fecha_inicio} | Tarifa doble:$${Math.round(b.tarifa_doble * 2)}/noche | Disponibles:${b.habitaciones_disponibles}`
    )
    .join("\n");

  const system = `Eres un asesor experto de ${brandName}. Tu trabajo es analizar el perfil del cliente y recomendar los 3 mejores paquetes disponibles de nuestro inventario.
Responde SOLO en JSON con formato:
{ "recommendations": [{ "blockId": number, "hotelName": string, "reason": string, "matchScore": number, "highlights": [string] }] }
Ordena por matchScore descendente (0-100). Considera: presupuesto, fechas, tipo de viajero. Si el inventario no tiene coincidencias exactas, recomienda las opciones más cercanas.`;

  const userMsg = `Perfil del cliente:
- Destino deseado: ${lead.destino || "flexible"}
- Presupuesto: ${lead.presupuesto || "no especificado"}
- Check-in deseado: ${lead.checkIn || "flexible"}
- Check-out deseado: ${lead.checkOut || "flexible"}
- Número de personas: ${lead.personas || 2}

Inventario disponible:
${inventoryText}

Recomienda los 3 mejores paquetes para este cliente.`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userMsg }],
    maxTokens: 1200,
  });

  const parsed = parseJsonSafe<{ recommendations: AIReco[] }>(raw);
  if (!parsed?.recommendations?.length) return [];

  return parsed.recommendations
    .slice(0, 3)
    .map((r) => {
      const block = blocks.find((b) => b.id === r.blockId);
      return {
        blockId:               r.blockId,
        hotelName:             r.hotelName || block?.hotel || "Hotel",
        tipoHabitacion:        block?.tipo_habitacion || "",
        reason:                r.reason,
        matchScore:            r.matchScore,
        highlights:            r.highlights || [],
        tarifaDoble:           block?.tarifa_doble ?? 0,
        fechaInicio:           block?.fecha_inicio || "",
        habitacionesDisponibles: block?.habitaciones_disponibles ?? 0,
      };
    });
}
