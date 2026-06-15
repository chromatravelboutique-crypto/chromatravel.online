/**
 * JOB: Expiración automática de holds de inventario
 * Cada 5 minutos libera reservas en estado 'hold' o 'pending_payment' que superaron su expiresAt.
 * Restaura habitaciones_disponibles en bloqueos con transacción atómica.
 */
import { getDb, getPool } from "../db";
import { reservas } from "@shared/schema";
import { and, inArray, lt, sql } from "drizzle-orm";

const HOLD_MINUTES = parseInt(process.env.HOLD_EXPIRY_MINUTES || "30");
const JOB_INTERVAL_MS = 5 * 60 * 1000; // cada 5 min

export async function expireHolds(): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    // 1. Buscar holds expirados
    const expired = await getDb()
      .select()
      .from(reservas)
      .where(
        and(
          inArray(reservas.status, ["hold", "pending_payment"]),
          lt(reservas.expiresAt, new Date())
        )
      );

    if (expired.length === 0) return;

    console.log(`[hold-expiry] ${expired.length} hold(s) expirados — liberando inventario`);

    // 2. Para cada reserva expirada: restaurar inventario + marcar expired (transacción por reserva)
    for (const reserva of expired) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Restaurar habitaciones en el MISMO bloqueo que se decrementó (por id —
        // hotel+fechas no basta porque el mismo bloqueo puede existir para ambas marcas)
        const restored = reserva.bloqueoId
          ? await client.query(
              `UPDATE bloqueos
               SET habitaciones_disponibles = habitaciones_disponibles + $1
               WHERE id = $2
               RETURNING habitaciones_disponibles`,
              [reserva.habitacionesReservadas, parseInt(reserva.bloqueoId, 10)]
            )
          : await client.query(
              `UPDATE bloqueos
               SET habitaciones_disponibles = habitaciones_disponibles + $1
               WHERE hotel = $2 AND tipo_habitacion = $3 AND fecha_inicio = $4 AND fecha_fin = $5
               RETURNING habitaciones_disponibles`,
              [
                reserva.habitacionesReservadas,
                reserva.hotel,
                reserva.tipoHabitacion,
                reserva.checkIn,
                reserva.checkOut,
              ]
            );

        // Marcar como expirada
        await getDb()
          .update(reservas)
          .set({ status: "expired", updatedAt: new Date() })
          .where(inArray(reservas.id, [reserva.id]));

        await client.query("COMMIT");

        const rooms = restored.rows[0]?.habitaciones_disponibles ?? "?";
        console.log(
          `[hold-expiry] ✓ ${reserva.hotel} | ${reserva.tipoHabitacion} | +${reserva.habitacionesReservadas} hab → disponibles: ${rooms}`
        );
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`[hold-expiry] ERROR en reserva ${reserva.id}:`, err);
      } finally {
        client.release();
      }
    }
  } catch (err) {
    console.error("[hold-expiry] Error general:", err);
  }
}

export function startHoldExpiryJob(): void {
  expireHolds();
  setInterval(expireHolds, JOB_INTERVAL_MS);
  console.log(`[hold-expiry] Job iniciado — hold ${HOLD_MINUTES} min, revisión cada 5 min`);
}
