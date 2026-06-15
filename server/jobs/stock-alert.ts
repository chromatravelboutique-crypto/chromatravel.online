/**
 * JOB: Alerta de stock bajo en bloqueos
 * Verifica bloqueos con habitaciones_disponibles <= 2 y envía WhatsApp al admin.
 * Deduplicación en memoria: no más de una alerta por bloqueo por día.
 */
import { getPool } from "../db";
import { sendBrandAdminAlert } from "../services/notification.service";

const LOW_STOCK_THRESHOLD = 2;
const JOB_INTERVAL_MS = 15 * 60 * 1000; // cada 15 min

// key: "id||brandCode" — almacena la fecha (YYYY-MM-DD) del último aviso
const alertedToday = new Map<string, string>();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function checkLowStock(): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    const today = todayStr();

    const { rows } = await pool.query<{
      id: number;
      hotel: string;
      tipo_habitacion: string;
      fecha_inicio: string;
      habitaciones_disponibles: number;
      brand_id: string | null;
      brand_code: string | null;
    }>(`
      SELECT b.id, b.hotel, b.tipo_habitacion, b.fecha_inicio,
             b.habitaciones_disponibles, b.brand_id,
             br.code AS brand_code
      FROM bloqueos b
      LEFT JOIN brands br ON br.id = b.brand_id
      WHERE b.estado = 'Activo'
        AND b.habitaciones_disponibles <= $1
        AND b.habitaciones_disponibles > 0
        AND b.fecha_inicio >= CURRENT_DATE
    `, [LOW_STOCK_THRESHOLD]);

    for (const row of rows) {
      const brandCode = row.brand_code || "chroma";
      const key = `${row.id}||${brandCode}`;

      if (alertedToday.get(key) === today) continue;

      alertedToday.set(key, today);

      const msg = `⚠️ STOCK BAJO\n🏨 ${row.hotel}\n🛏️ ${row.tipo_habitacion}\n📅 Check-in: ${row.fecha_inicio}\n🔢 Solo quedan ${row.habitaciones_disponibles} habitación(es) disponible(s)`;

      await sendBrandAdminAlert(brandCode, msg);
      console.log(`[stock-alert] Alerta enviada: ${row.hotel} (${row.habitaciones_disponibles} hab.)`);
    }

    // Limpiar entradas de días anteriores
    alertedToday.forEach((date, k) => {
      if (date !== today) alertedToday.delete(k);
    });
  } catch (err) {
    console.error("[stock-alert] Error:", err);
  }
}

export function startStockAlertJob(): void {
  checkLowStock();
  setInterval(checkLowStock, JOB_INTERVAL_MS);
  console.log("[stock-alert] Job iniciado — verificación cada 15 min");
}
