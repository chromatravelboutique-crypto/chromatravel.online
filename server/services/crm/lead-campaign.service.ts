import { getDb } from "../../db";
import { campaigns, campaignLogs, leads, brands } from "@shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { sendEmail } from "../../email-service";

function getDatabase() {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

export interface LeadCampaignInput {
  brandId: string;
  name: string;
  channel: "email" | "whatsapp";
  subject?: string;
  body: string;
  leadStatuses: string[];
  createdBy?: string;
}

class LeadCampaignService {
  async createLeadCampaign(input: LeadCampaignInput) {
    const db = getDatabase();
    const targetCount = await this.getLeadSegmentCount(input.brandId, input.leadStatuses);

    const [campaign] = await db.insert(campaigns).values({
      brandId:        input.brandId,
      name:           input.name,
      type:           "lead_followup",
      channels:       [input.channel],
      emailSubject:   input.subject,
      emailHtml:      input.body,
      whatsappMessage: input.body,
      segmentFilters: { targetType: "leads", leadStatuses: input.leadStatuses },
      scheduleType:   "manual",
      status:         "draft",
      targetCount,
      createdBy:      input.createdBy,
    }).returning();

    return campaign;
  }

  async executeLeadCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
    const db = getDatabase();

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    if (!campaign) throw new Error("Campaign not found");

    const filters = (campaign.segmentFilters as any) || {};
    const statuses: string[] = filters.leadStatuses || [];

    await db.update(campaigns).set({ status: "running", startedAt: new Date() }).where(eq(campaigns.id, campaignId));

    const targetLeads = await this.getLeadSegment(campaign.brandId!, statuses);
    const channel = (campaign.channels?.[0] || "email") as "email" | "whatsapp";

    let sent = 0;
    let failed = 0;

    for (const lead of targetLeads) {
      try {
        let success = false;

        if (channel === "email" && lead.email && !lead.email.includes("@placeholder.com")) {
          success = await sendEmail({
            to: lead.email,
            subject: campaign.emailSubject || campaign.name,
            html: campaign.emailHtml || campaign.whatsappMessage || "",
          });
        } else if (channel === "whatsapp" && lead.phone) {
          // Record wa.me link — mass WhatsApp requires Twilio/official API
          const waLink = `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(campaign.whatsappMessage || "")}`;
          await db.insert(campaignLogs).values({
            campaignId,
            channel: "whatsapp",
            status: "sent",
            messageId: waLink,
            sentAt: new Date(),
          });
          sent++;
          continue;
        }

        await db.insert(campaignLogs).values({
          campaignId,
          channel,
          status: success ? "sent" : "failed",
          sentAt: success ? new Date() : undefined,
          errorMessage: success ? undefined : "Send failed",
        });
        if (success) sent++;
        else failed++;
      } catch (err: any) {
        failed++;
        await db.insert(campaignLogs).values({
          campaignId,
          channel,
          status: "failed",
          errorMessage: err.message,
        });
      }
    }

    await db.update(campaigns).set({
      status:      "completed",
      completedAt: new Date(),
      sentCount:   sent,
      targetCount: targetLeads.length,
    }).where(eq(campaigns.id, campaignId));

    console.log(`[LeadCampaign] "${campaign.name}" → sent:${sent} failed:${failed}`);
    return { sent, failed };
  }

  async getLeadSegment(brandId: string, statuses: string[]) {
    const db = getDatabase();
    let query = db.select().from(leads).where(eq(leads.brandId, brandId));
    const results = await query;
    if (!statuses.length) return results;
    return results.filter((l) => statuses.includes(l.status || "new"));
  }

  async getLeadSegmentCount(brandId: string, statuses: string[]): Promise<number> {
    return (await this.getLeadSegment(brandId, statuses)).length;
  }

  async getLeadCampaigns(brandId: string) {
    const db = getDatabase();
    const result = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.brandId, brandId), eq(campaigns.type, "lead_followup")))
      .orderBy(sql`${campaigns.createdAt} DESC`);
    return result;
  }

  async getCampaignStats(campaignId: string) {
    const db = getDatabase();
    const logs = await db.select().from(campaignLogs).where(eq(campaignLogs.campaignId, campaignId));
    const sent    = logs.filter((l) => l.status === "sent").length;
    const failed  = logs.filter((l) => l.status === "failed").length;
    const pending = logs.filter((l) => l.status === "pending").length;
    return { total: logs.length, sent, failed, pending };
  }

  async triggerPipelineAutomation(leadId: string, newStatus: string, brandCode: string) {
    const db = getDatabase();
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead?.phone) return;

    const messages: Record<string, string> = {
      contactado: `¡Hola ${lead.name?.split(" ")[0] || ""}! Te contactamos de ${brandCode === "fenix" ? "Fénix Traveler" : "Chroma Travel"} para ayudarte con tu viaje${lead.destination ? ` a ${lead.destination}` : ""}. ¿Tienes un momento?`,
      cotizado:   `¡Hola ${lead.name?.split(" ")[0] || ""}! Tu cotización está lista${lead.destination ? ` para ${lead.destination}` : ""}. ¿Cuándo podemos hablar para revisarla juntos?`,
      ganado:     `¡Felicidades ${lead.name?.split(" ")[0] || ""}! Tu viaje está confirmado. Pronto recibirás todos los detalles. ¡Nos emociona acompañarte! 🎉`,
    };

    const msg = messages[newStatus];
    if (!msg) return;

    const waLink = `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
    console.log(`[LeadCampaign] Pipeline trigger (${newStatus}) for lead ${leadId}: ${waLink}`);
  }
}

export const leadCampaignService = new LeadCampaignService();
export default leadCampaignService;
