/**
 * JOB: Dispatcher de campaignLogs pendientes
 * Cada 5 minutos lee campaign_logs con status='pending' y los despacha
 * vía Twilio (WhatsApp) o Nodemailer (email) según el campo `channel`.
 * Actualiza status a 'sent' o 'failed' con messageId/errorMessage.
 */
import { getDb } from "../db";
import { campaignLogs, campaigns, users, brands } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { sendWhatsAppMessage } from "../crm/whatsapp";
import { sendEmail } from "../crm/communications";

const JOB_INTERVAL_MS = 5 * 60 * 1000;
const BATCH_SIZE = 50;

export async function dispatchPendingLogs(): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const pending = await db
      .select({
        logId: campaignLogs.id,
        channel: campaignLogs.channel,
        userId: campaignLogs.userId,
        campaignId: campaignLogs.campaignId,
      })
      .from(campaignLogs)
      .where(eq(campaignLogs.status, "pending"))
      .limit(BATCH_SIZE);

    if (pending.length === 0) return;

    console.log(`[campaign-dispatcher] ${pending.length} log(s) pendientes`);

    for (const log of pending) {
      try {
        if (!log.campaignId) {
          await db
            .update(campaignLogs)
            .set({ status: "failed", errorMessage: "Sin campaignId — mensaje no determinable" })
            .where(eq(campaignLogs.id, log.logId));
          continue;
        }

        const [campaign] = await db
          .select({
            whatsappMessage: campaigns.whatsappMessage,
            emailHtml: campaigns.emailHtml,
            emailSubject: campaigns.emailSubject,
            brandId: campaigns.brandId,
          })
          .from(campaigns)
          .where(eq(campaigns.id, log.campaignId));

        if (!campaign) continue;

        let userPhone: string | null = null;
        let userEmail: string | null = null;
        if (log.userId) {
          const [user] = await db
            .select({ phone: users.phone, email: users.email })
            .from(users)
            .where(eq(users.id, log.userId));
          userPhone = user?.phone ?? null;
          userEmail = user?.email ?? null;
        }

        const [brand] = campaign.brandId
          ? await db
              .select({ code: brands.code })
              .from(brands)
              .where(eq(brands.id, campaign.brandId))
          : [{ code: "chroma" }];
        const brandCode = brand?.code ?? "chroma";

        let success = false;
        let messageId: string | undefined;
        let errorMessage: string | undefined;

        if (log.channel === "whatsapp") {
          if (!userPhone) {
            await db
              .update(campaignLogs)
              .set({ status: "failed", errorMessage: "Usuario sin teléfono" })
              .where(eq(campaignLogs.id, log.logId));
            continue;
          }
          const message = campaign.whatsappMessage ?? "Tienes un mensaje de tu agencia de viajes.";
          const result = await sendWhatsAppMessage(userPhone, message, brandCode);
          success = result.success;
          messageId = result.messageId;
          errorMessage = result.error;
        } else if (log.channel === "email") {
          if (!userEmail) {
            await db
              .update(campaignLogs)
              .set({ status: "failed", errorMessage: "Usuario sin email" })
              .where(eq(campaignLogs.id, log.logId));
            continue;
          }
          const subject = campaign.emailSubject ?? "Mensaje de tu agencia";
          const html = campaign.emailHtml ?? "<p>Tienes un mensaje de tu agencia de viajes.</p>";
          success = await sendEmail({ to: userEmail, subject, html }, brandCode);
          if (!success) errorMessage = "sendEmail retornó false";
        }

        await db
          .update(campaignLogs)
          .set({
            status: success ? "sent" : "failed",
            ...(messageId ? { messageId } : {}),
            ...(errorMessage ? { errorMessage } : {}),
            ...(success ? { sentAt: new Date() } : {}),
          })
          .where(eq(campaignLogs.id, log.logId));

        console.log(`[campaign-dispatcher] log ${log.logId} → ${success ? "sent" : "failed"}`);
      } catch (err: any) {
        console.error(`[campaign-dispatcher] Error en log ${log.logId}:`, err.message);
        await db
          .update(campaignLogs)
          .set({ status: "failed", errorMessage: err.message })
          .where(eq(campaignLogs.id, log.logId));
      }
    }
  } catch (err) {
    console.error("[campaign-dispatcher] Error general:", err);
  }
}

export function startCampaignDispatcher(): void {
  dispatchPendingLogs();
  setInterval(dispatchPendingLogs, JOB_INTERVAL_MS);
  console.log("[campaign-dispatcher] Job iniciado — despacho cada 5 min");
}
