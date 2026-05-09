/**
 * Seed script: Bloqueos Fenix 2026
 * Reads: attached_assets/bloqueos_fenix_2026_COMPLETO_1776886180096.csv
 * Groups by (hotel, suite_tipo, fecha_entrada, fecha_salida) → one bloqueo row per group
 * Maps SGL/DBL/TPL prices into tarifa_sencilla/tarifa_doble/tarifa_triple columns
 * Uses UPSERT — safe to run multiple times
 */

import fs from "fs";
import path from "path";
import { parse as csvParse } from "csv-parse/sync";
import { pool as dbPool } from "./db";

// Try multiple filenames to support both development and production environments
const POSSIBLE_CSV_PATHS = [
  "bloqueos_fenix_2026_COMPLETO.csv",
  "bloqueos_fenix_2026_COMPLETO_1776886180096.csv",
  "bloqueos_fenix_2026.csv",
].map((f) => path.join(process.cwd(), "attached_assets", f));

const CSV_PATH = POSSIBLE_CSV_PATHS.find((p) => fs.existsSync(p)) ?? POSSIBLE_CSV_PATHS[0];

interface FenixRow {
  Hotel: string;
  Suite_Tipo: string;
  Destino: string;
  Fecha_Entrada: string;
  Fecha_Salida: string;
  Tipo_Habitacion: string;
  Tarifa_Publica_xpxn: string;
  Comision_Operadora_15pct: string;
  Tarifa_Neta_xpxn: string;
  Precio_Venta_Fenix_xpxn: string;
  Precio_Con_Tarjeta_xpxn: string;
  Precio_SPEI_Efectivo_xpxn: string;
  Menores: string;
  Beneficios: string;
  Tier_Kuani: string;
  Puntos_Kuani_xpxn: string;
  Fuente: string;
}

interface BloqueoGroup {
  hotel: string;
  tipo_habitacion: string;
  destino: string;
  fecha_inicio: string;
  fecha_fin: string;
  tarifa_sencilla: number | null;
  tarifa_doble: number | null;
  tarifa_triple: number | null;
  tarifa_cuadruple: number | null;
  tarifa_primer_menor: number | null;
  tarifa_junior: number | null;
  observaciones: string | null;
  proveedor: string | null;
  habitaciones_disponibles: number;
  estado: string;
}

function parseNum(v: string): number | null {
  if (!v || v.trim() === "") return null;
  const n = parseFloat(v.replace(/[,$\s]/g, ""));
  return isNaN(n) ? null : n;
}

function parseMinorCost(menores: string): number | null {
  if (!menores || menores.trim() === "") return null;
  const gratis = /GRATIS/i.test(menores);
  if (gratis) return 0;
  const match = menores.match(/\$?([\d,]+(?:\.\d+)?)/);
  if (match) {
    const n = parseFloat(match[1].replace(/,/g, ""));
    return isNaN(n) ? null : n;
  }
  return null;
}

export async function seedBloqueosFenix(): Promise<{ inserted: number; updated: number; errors: number }> {
  if (!fs.existsSync(CSV_PATH)) {
    console.warn("[Fenix Seed] CSV not found:", CSV_PATH);
    return { inserted: 0, updated: 0, errors: 0 };
  }

  const raw = fs.readFileSync(CSV_PATH, "utf-8")
    .replace(/^\uFEFF/, ""); // strip BOM

  const rows: FenixRow[] = csvParse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`[Fenix Seed] Parsed ${rows.length} rows from CSV`);

  // Group by (hotel, suite_tipo, fecha_entrada, fecha_salida)
  const groups = new Map<string, BloqueoGroup>();

  for (const row of rows) {
    const hotel = (row.Hotel || "").trim();
    const suiteTipo = (row.Suite_Tipo || "").trim() || "Estándar";
    const destino = (row.Destino || "").trim();
    const fechaInicio = (row.Fecha_Entrada || "").trim();
    const fechaFin = (row.Fecha_Salida || "").trim();
    const tipoHab = (row.Tipo_Habitacion || "").toUpperCase().trim();
    const precio = parseNum(row.Tarifa_Publica_xpxn);
    const fuente = (row.Fuente || "FENIX").trim();
    const menores = (row.Menores || "").trim();
    const beneficios = (row.Beneficios || "").trim();

    if (!hotel || !fechaInicio || !fechaFin) continue;

    const key = `${hotel}||${suiteTipo}||${fechaInicio}||${fechaFin}`;

    if (!groups.has(key)) {
      const obs = [menores, beneficios].filter(Boolean).join(" | ") || null;
      groups.set(key, {
        hotel,
        tipo_habitacion: suiteTipo,
        destino,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tarifa_sencilla: null,
        tarifa_doble: null,
        tarifa_triple: null,
        tarifa_cuadruple: null,
        tarifa_primer_menor: parseMinorCost(menores),
        tarifa_junior: null,
        observaciones: obs,
        proveedor: fuente,
        habitaciones_disponibles: 20,
        estado: "Activo",
      });
    }

    const g = groups.get(key)!;

    if (tipoHab === "SGL" || tipoHab === "SENCILLA") {
      g.tarifa_sencilla = precio;
    } else if (tipoHab === "DBL" || tipoHab === "DOBLE") {
      g.tarifa_doble = precio;
    } else if (tipoHab === "TPL" || tipoHab === "TRIPLE") {
      g.tarifa_triple = precio;
    } else if (tipoHab === "QDP" || tipoHab === "QUAD" || tipoHab === "CUADRUPLE") {
      g.tarifa_cuadruple = precio;
    }

    // Update observaciones with full context from first non-empty row
    if (!g.observaciones) {
      const obs = [menores, beneficios].filter(Boolean).join(" | ");
      if (obs) g.observaciones = obs;
    }
  }

  console.log(`[Fenix Seed] ${groups.size} unique bloqueo groups to upsert`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Ensure inventory_logs table exists
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        filename TEXT NOT NULL,
        provider TEXT,
        records_total INTEGER DEFAULT 0,
        records_inserted INTEGER DEFAULT 0,
        records_updated INTEGER DEFAULT 0,
        records_skipped INTEGER DEFAULT 0,
        errors JSONB DEFAULT '[]',
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (_) {}

  // Try to create unique index (may fail if duplicate data exists — that's OK)
  let hasIndex = false;
  try {
    await dbPool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS bloqueos_upsert_key
      ON bloqueos (hotel, fecha_inicio, fecha_fin, tipo_habitacion)
    `);
    hasIndex = true;
  } catch (_) {
    // Duplicates exist — use manual check-then-upsert approach
    hasIndex = false;
  }

  const groupsArr = Array.from(groups.values());

  for (const g of groupsArr) {
    try {
      if (hasIndex) {
        // Fast path: use ON CONFLICT
        const result = await dbPool.query(
          `INSERT INTO bloqueos (
            hotel, proveedor, fecha_inicio, fecha_fin, tipo_habitacion,
            tarifa_sencilla, tarifa_doble, tarifa_triple, tarifa_cuadruple,
            tarifa_primer_menor, tarifa_junior,
            habitaciones_disponibles, observaciones, estado, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
          ON CONFLICT (hotel, fecha_inicio, fecha_fin, tipo_habitacion)
          DO UPDATE SET
            proveedor = EXCLUDED.proveedor,
            tarifa_sencilla = COALESCE(EXCLUDED.tarifa_sencilla, bloqueos.tarifa_sencilla),
            tarifa_doble = COALESCE(EXCLUDED.tarifa_doble, bloqueos.tarifa_doble),
            tarifa_triple = COALESCE(EXCLUDED.tarifa_triple, bloqueos.tarifa_triple),
            tarifa_cuadruple = COALESCE(EXCLUDED.tarifa_cuadruple, bloqueos.tarifa_cuadruple),
            tarifa_primer_menor = COALESCE(EXCLUDED.tarifa_primer_menor, bloqueos.tarifa_primer_menor),
            observaciones = COALESCE(EXCLUDED.observaciones, bloqueos.observaciones),
            estado = EXCLUDED.estado
          RETURNING (xmax = 0) AS is_insert`,
          [
            g.hotel, g.proveedor, g.fecha_inicio, g.fecha_fin, g.tipo_habitacion,
            g.tarifa_sencilla, g.tarifa_doble, g.tarifa_triple, g.tarifa_cuadruple,
            g.tarifa_primer_menor, g.tarifa_junior,
            g.habitaciones_disponibles, g.observaciones, g.estado,
          ]
        );
        if (result.rows[0]?.is_insert) inserted++;
        else updated++;
      } else {
        // Slow path: check first, then update or insert
        const existing = await dbPool.query(
          `SELECT id FROM bloqueos WHERE hotel = $1 AND fecha_inicio = $2 AND fecha_fin = $3 AND tipo_habitacion = $4 LIMIT 1`,
          [g.hotel, g.fecha_inicio, g.fecha_fin, g.tipo_habitacion]
        );
        if (existing.rows.length > 0) {
          await dbPool.query(
            `UPDATE bloqueos SET
               proveedor = $1,
               tarifa_sencilla = COALESCE($2, tarifa_sencilla),
               tarifa_doble = COALESCE($3, tarifa_doble),
               tarifa_triple = COALESCE($4, tarifa_triple),
               tarifa_cuadruple = COALESCE($5, tarifa_cuadruple),
               tarifa_primer_menor = COALESCE($6, tarifa_primer_menor),
               observaciones = COALESCE($7, observaciones),
               estado = $8
             WHERE id = $9`,
            [
              g.proveedor,
              g.tarifa_sencilla, g.tarifa_doble, g.tarifa_triple, g.tarifa_cuadruple,
              g.tarifa_primer_menor,
              g.observaciones, g.estado,
              existing.rows[0].id,
            ]
          );
          updated++;
        } else {
          await dbPool.query(
            `INSERT INTO bloqueos (
              hotel, proveedor, fecha_inicio, fecha_fin, tipo_habitacion,
              tarifa_sencilla, tarifa_doble, tarifa_triple, tarifa_cuadruple,
              tarifa_primer_menor, tarifa_junior,
              habitaciones_disponibles, observaciones, estado, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())`,
            [
              g.hotel, g.proveedor, g.fecha_inicio, g.fecha_fin, g.tipo_habitacion,
              g.tarifa_sencilla, g.tarifa_doble, g.tarifa_triple, g.tarifa_cuadruple,
              g.tarifa_primer_menor, g.tarifa_junior,
              g.habitaciones_disponibles, g.observaciones, g.estado,
            ]
          );
          inserted++;
        }
      }
    } catch (e: any) {
      errors++;
      if (errors <= 5) console.error(`[Fenix Seed] Row error ${g.hotel}: ${e.message}`);
    }
  }

  // Log to inventory_logs
  try {
    await dbPool.query(
      `INSERT INTO inventory_logs (action, filename, provider, records_total, records_inserted, records_updated, records_skipped, errors, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [
        "seed",
        "bloqueos_fenix_2026_COMPLETO.csv",
        "FENIX",
        groups.size,
        inserted,
        updated,
        errors,
        JSON.stringify([]),
      ]
    );
  } catch (_) {}

  console.log(`[Fenix Seed] Done: ${inserted} inserted, ${updated} updated, ${errors} errors`);
  return { inserted, updated, errors };
}
