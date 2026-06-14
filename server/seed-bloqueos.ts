import { getPool } from "./db";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export async function seedBloqueos(): Promise<void> {
  const pool = getPool();
  if (!pool) {
    console.log("Database not available, skipping bloqueos seed");
    return;
  }

  try {
    // Ensure brand_id column exists (idempotent — fails silently if already present)
    await pool.query(
      `ALTER TABLE bloqueos ADD COLUMN IF NOT EXISTS brand_id INTEGER`
    ).catch(() => {});

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM bloqueos WHERE brand_id IS NULL OR brand_id IN (
         SELECT id FROM brands WHERE domain = 'chromatravel.online' LIMIT 1
       )`
    );
    const count = parseInt(countResult.rows[0].count);

    if (count > 0) {
      console.log(`Bloqueos (Chroma) already seeded (${count} records), skipping`);
      return;
    }

    const brandRow = await pool.query(
      `SELECT id FROM brands WHERE domain = 'chromatravel.online' LIMIT 1`
    );
    const brandId: number | null = brandRow.rows[0]?.id ?? null;

    console.log("Seeding Chroma bloqueos from CSV...");

    const csvPath = path.resolve("attached_assets/bloqueos_2026_consolidado_final_1770569075903.csv");
    if (!fs.existsSync(csvPath)) {
      console.log("Bloqueos CSV not found, skipping seed");
      return;
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const records: Record<string, string>[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    if (records.length === 0) {
      console.log("Bloqueos CSV is empty, skipping seed");
      return;
    }

    let inserted = 0;
    const batchSize = 50;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const values: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      for (const row of batch) {
        values.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, $${paramIdx+8}, $${paramIdx+9}, $${paramIdx+10}, $${paramIdx+11}, $${paramIdx+12}, $${paramIdx+13}, $${paramIdx+14}, $${paramIdx+15})`);

        params.push(
          row.hotel || null,
          row.proveedor || null,
          row.fecha_inicio || null,
          row.fecha_fin || null,
          row.tipo_habitacion || null,
          parseNum(row.tarifa_sencilla),
          parseNum(row.tarifa_doble),
          parseNum(row.tarifa_triple),
          parseNum(row.tarifa_cuadruple),
          parseNum(row.tarifa_primer_menor),
          parseNum(row.tarifa_segundo_menor),
          parseNum(row.tarifa_junior),
          parseNum(row.habitaciones_disponibles),
          row.observaciones || null,
          row.estado || "Activo",
          brandId,
        );

        paramIdx += 16;
      }

      if (values.length > 0) {
        await pool.query(
          `INSERT INTO bloqueos (hotel, proveedor, fecha_inicio, fecha_fin, tipo_habitacion, tarifa_sencilla, tarifa_doble, tarifa_triple, tarifa_cuadruple, tarifa_primer_menor, tarifa_segundo_menor, tarifa_junior, habitaciones_disponibles, observaciones, estado, brand_id) VALUES ${values.join(", ")}`,
          params
        );
        inserted += values.length;
      }
    }

    console.log(`Chroma bloqueos seeding complete: ${inserted} records inserted`);
  } catch (error) {
    console.error("Bloqueos seeding failed:", error);
  }
}

function parseNum(val: string | undefined | null): number | null {
  if (!val || val.trim() === "") return null;
  const num = parseFloat(val.trim());
  return isNaN(num) ? null : num;
}
