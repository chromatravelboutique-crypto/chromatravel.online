/**
 * JOB: Reporte diario ERP vía WhatsApp
 * Corre cada día a las 8:00 AM (cron: "0 8 * * *")
 * Envía resumen del día anterior al admin de cada marca activa.
 */
import cron from "node-cron";
import { getPool, getDb } from "../db";
import { brands } from "@shared/schema";
import { sendBrandAdminAlert } from "../services/notification.service";

async function buildReport(brandId: string, brandCode: string): Promise<string> {
  const pool = getPool();
  const db = getDb();
  if (!pool) return "";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStart = new Date(yesterday); yStart.setHours(0, 0, 0, 0);
  const yEnd   = new Date(yesterday); yEnd.setHours(23, 59, 59, 999);

  const [leadsR, reservasR, holdsR, stockR] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total FROM leads WHERE brand_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [brandId, yStart, yEnd]
    ),
    pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(CAST(precio_venta AS numeric)), 0) AS monto
       FROM reservas WHERE brand_id = $1 AND status = 'confirmed' AND created_at >= $2 AND created_at <= $3`,
      [brandId, yStart, yEnd]
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM reservas WHERE brand_id = $1 AND status IN ('hold','pending_payment')`,
      [brandId]
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM bloqueos WHERE brand_id = $1 AND estado = 'Activo' AND habitaciones_disponibles <= 2 AND habitaciones_disponibles > 0 AND fecha_inicio >= CURRENT_DATE`,
      [brandId]
    ),
  ]);

  const nuevosLeads    = leadsR.rows[0]?.total ?? 0;
  const reservas       = reservasR.rows[0]?.total ?? 0;
  const montoMXN       = parseFloat(reservasR.rows[0]?.monto ?? "0");
  const holdsActivos   = holdsR.rows[0]?.total ?? 0;
  const stockBajo      = stockR.rows[0]?.total ?? 0;

  const fecha = yesterday.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });

  return `📊 REPORTE DIARIO ${brandCode.toUpperCase()}
📅 ${fecha}
━━━━━━━━━━━━━━━━━━━
🔔 Nuevos leads: ${nuevosLeads}
✅ Reservas confirmadas: ${reservas} ($${montoMXN.toLocaleString("es-MX")} MXN)
⏳ Holds pendientes: ${holdsActivos}
⚠️ Bloqueos stock bajo: ${stockBajo}
━━━━━━━━━━━━━━━━━━━
Buenos días. 🌅`;
}

async function sendDailyReports(): Promise<void> {
  const db = getDb();
  try {
    const allBrands = await db.select({ id: brands.id, code: brands.code }).from(brands);

    for (const brand of allBrands) {
      try {
        const report = await buildReport(brand.id, brand.code);
        if (report) await sendBrandAdminAlert(brand.code, report);
      } catch (err) {
        console.error(`[daily-report] Error para marca ${brand.code}:`, err);
      }
    }
    console.log("[daily-report] Reportes enviados");
  } catch (err) {
    console.error("[daily-report] Error general:", err);
  }
}

export function startDailyReportJob(): void {
  cron.schedule("0 8 * * *", sendDailyReports, { timezone: "America/Mexico_City" });
  console.log("[daily-report] Job iniciado — reporte diario a las 8:00 AM");
}
