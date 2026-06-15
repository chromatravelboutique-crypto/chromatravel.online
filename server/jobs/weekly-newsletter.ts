/**
 * JOB: Newsletter semanal con mejores ofertas de bloqueos
 * Cron: "0 9 * * 1" (lunes a las 9am hora México)
 * Envía las 3 mejores ofertas activas a todos los suscriptores activos de cada marca.
 */
import cron from "node-cron";
import { getPool, getDb } from "../db";
import { brands, newsletterSubscribers } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail as sendCrmEmail } from "../crm/communications";

interface BloqueoOferta {
  hotel: string;
  tipo_habitacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  tarifa_doble: number;
  habitaciones_disponibles: number;
}

function buildNewsletterHtml(
  brandName: string,
  primaryColor: string,
  domain: string,
  ofertas: BloqueoOferta[],
  nombreSuscriptor?: string | null
): string {
  const greeting = nombreSuscriptor ? `Hola ${nombreSuscriptor},` : "Hola,";

  const ofertasHtml = ofertas
    .map(
      (o) => `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h3 style="margin:0 0 4px;font-size:16px;color:#111827;">${o.hotel}</h3>
      <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">${o.tipo_habitacion}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <span style="font-size:13px;color:#6b7280;">📅 Check-in: <strong>${o.fecha_inicio}</strong></span>
        </div>
        <div style="text-align:right;">
          <span style="font-size:22px;font-weight:bold;color:${primaryColor};">
            $${Math.round(o.tarifa_doble * 2).toLocaleString("es-MX")} MXN
          </span>
          <span style="display:block;font-size:12px;color:#6b7280;">por noche (2 pax)</span>
        </div>
      </div>
      <div style="margin-top:10px;">
        <a href="https://www.${domain}/bloqueos"
           style="display:inline-block;background:${primaryColor};color:#fff;text-decoration:none;padding:8px 20px;border-radius:8px;font-size:14px;font-weight:600;">
          Ver disponibilidad
        </a>
      </div>
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;margin-top:24px;margin-bottom:24px;">
    <div style="background:${primaryColor};padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;">${brandName}</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Ofertas exclusivas de la semana</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:16px;color:#374151;">${greeting}</p>
      <p style="font-size:15px;color:#374151;line-height:1.6;">
        Estas son las <strong>3 mejores ofertas</strong> de nuestra cartera de bloqueos para esta semana.
        Disponibilidad limitada — recomendamos reservar cuanto antes.
      </p>
      ${ofertasHtml}
      <div style="text-align:center;margin-top:24px;">
        <a href="https://www.${domain}/bloqueos"
           style="display:inline-block;background:${primaryColor};color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;">
          Ver todas las ofertas
        </a>
      </div>
    </div>
    <div style="background:#f3f4f6;padding:16px 24px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        Recibes este correo porque te suscribiste en <a href="https://www.${domain}" style="color:${primaryColor};">${domain}</a>.
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendWeeklyNewsletter(): Promise<void> {
  const pool = getPool();
  const db = getDb();
  if (!pool) return;

  try {
    const allBrands = await db.select().from(brands).where(eq(brands.active, true));

    for (const brand of allBrands) {
      try {
        // Get 3 best-priced active bloqueos for this brand
        const marca = brand.code === "fenix" ? "fenix" : "chroma";
        const { rows: ofertasRows } = await pool.query<BloqueoOferta>(`
          SELECT hotel, tipo_habitacion, fecha_inicio::text, fecha_fin::text,
                 CAST(tarifa_doble AS numeric) AS tarifa_doble,
                 habitaciones_disponibles
          FROM bloqueos
          WHERE estado = 'Activo'
            AND habitaciones_disponibles > 0
            AND fecha_inicio >= CURRENT_DATE
            AND (marca = $1 OR marca IS NULL)
          ORDER BY tarifa_doble ASC NULLS LAST
          LIMIT 3
        `, [marca]);

        if (ofertasRows.length === 0) {
          console.log(`[newsletter] Sin ofertas para ${brand.code}, saltando.`);
          continue;
        }

        // Get active subscribers for this brand
        const subs = await db
          .select()
          .from(newsletterSubscribers)
          .where(
            and(
              eq(newsletterSubscribers.brandId, brand.id),
              eq(newsletterSubscribers.activo, true)
            )
          );

        if (subs.length === 0) {
          console.log(`[newsletter] Sin suscriptores para ${brand.code}.`);
          continue;
        }

        const primaryColor = brand.primaryColor || "#10b981";
        const domain = brand.domain || "chromatravel.online";

        let sent = 0;
        for (const sub of subs) {
          const html = buildNewsletterHtml(brand.name, primaryColor, domain, ofertasRows, sub.nombre);
          const ok = await sendCrmEmail(
            {
              to: sub.email,
              subject: `🌟 Ofertas exclusivas esta semana — ${brand.name}`,
              html,
            },
            brand.code
          );
          if (ok) sent++;
          // Small delay to avoid SMTP throttling
          await new Promise((r) => setTimeout(r, 200));
        }

        console.log(`[newsletter] ${brand.name}: ${sent}/${subs.length} emails enviados.`);
      } catch (brandErr) {
        console.error(`[newsletter] Error para ${brand.code}:`, brandErr);
      }
    }
  } catch (err) {
    console.error("[newsletter] Error general:", err);
  }
}

export function startWeeklyNewsletterJob(): void {
  // Lunes a las 9am hora México
  cron.schedule("0 9 * * 1", sendWeeklyNewsletter, {
    timezone: "America/Mexico_City",
  });
  console.log("[newsletter] Job iniciado — envío cada lunes a las 9am");
}
