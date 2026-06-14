/**
 * CRON: Limpieza automática de bloqueos vencidos
 * Elimina bloqueos con fecha_inicio < hoy + 10 días (ventana configurable)
 * Se ejecuta cada 24h
 */
import { getPool } from "../db";

const DAYS_AHEAD = parseInt(process.env.CLEANUP_DAYS_AHEAD || "10");

export async function cleanupBloqueos(): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + DAYS_AHEAD);
  const cutoff = cutoffDate.toISOString().split("T")[0];

  const pool = getPool();
  if (!pool) return;
  try {
    const result = await pool.query(
      `DELETE FROM bloqueos 
       WHERE fecha_inicio < $1
       RETURNING id, hotel, fecha_inicio`,
      [cutoff]
    );

    const count = result.rowCount ?? 0;
    if (count > 0) {
      console.log(`[cleanup-bloqueos] ${new Date().toISOString()} — Eliminados ${count} bloqueos anteriores a ${cutoff}`);
    }
  } catch (err) {
    console.error("[cleanup-bloqueos] Error:", err);
  }
}

export function startCleanupJob(): void {
  // Ejecutar al iniciar
  cleanupBloqueos();

  // Ejecutar cada 24 horas
  setInterval(cleanupBloqueos, 24 * 60 * 60 * 1000);

  console.log(`[cleanup-bloqueos] Job iniciado — limpia bloqueos con check-in < hoy + ${DAYS_AHEAD} días, cada 24h`);
}
