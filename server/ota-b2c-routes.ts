/**
 * OTA B2C Module — Isolated routes for OTA B2C features
 * Covers: Inventory Upload, Deposit Calculator, Clip Payments, Social Share, Agency Toggle
 * 
 * SAFE: Does not modify any existing routes or configuration.
 * Register in server/routes.ts by calling registerOtaB2cRoutes(app) at the end.
 */

import type { Express, Request, Response } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { parse as csvParse } from "csv-parse/sync";
import crypto from "crypto";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ];
    const allowedExt = [".csv", ".xls", ".xlsx"];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos CSV o XLSX"));
    }
  },
});

function sanitizeInput(str: string): string {
  return str.replace(/[<>"'&]/g, "").trim();
}

// ─── INVENTORY LOG helper ─────────────────────────────────────────────────────
async function writeInventoryLog(pool: any, opts: {
  action: string;
  filename: string;
  provider?: string;
  recordsTotal: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
  userId?: string;
}) {
  try {
    await pool.query(
      `INSERT INTO inventory_logs (action, filename, provider, records_total, records_inserted, records_updated, records_skipped, errors, user_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
       ON CONFLICT DO NOTHING`,
      [
        opts.action, opts.filename, opts.provider || null,
        opts.recordsTotal, opts.recordsInserted, opts.recordsUpdated,
        opts.recordsSkipped, JSON.stringify(opts.errors),
        opts.userId || null,
      ]
    );
  } catch {
    // Table may not exist yet; ensure it's created below
  }
}

// ─── Normalize CSV/XLSX rows to bloqueo shape ─────────────────────────────────
const COLUMN_MAP: Record<string, string> = {
  hotel: "hotel",
  "nombre hotel": "hotel",
  proveedor: "proveedor",
  provider: "proveedor",
  "fecha inicio": "fecha_inicio",
  "check-in": "fecha_inicio",
  checkin: "fecha_inicio",
  "fecha fin": "fecha_fin",
  "check-out": "fecha_fin",
  checkout: "fecha_fin",
  "tipo habitacion": "tipo_habitacion",
  "tipo habitación": "tipo_habitacion",
  "room type": "tipo_habitacion",
  "tarifa sencilla": "tarifa_sencilla",
  sgl: "tarifa_sencilla",
  single: "tarifa_sencilla",
  "tarifa doble": "tarifa_doble",
  dbl: "tarifa_doble",
  double: "tarifa_doble",
  "tarifa triple": "tarifa_triple",
  tpl: "tarifa_triple",
  triple: "tarifa_triple",
  "tarifa cuadruple": "tarifa_cuadruple",
  "tarifa cuádruple": "tarifa_cuadruple",
  quad: "tarifa_cuadruple",
  "tarifa primer menor": "tarifa_primer_menor",
  "menor 1": "tarifa_primer_menor",
  "child 1": "tarifa_primer_menor",
  "tarifa segundo menor": "tarifa_segundo_menor",
  "menor 2": "tarifa_segundo_menor",
  "child 2": "tarifa_segundo_menor",
  "tarifa junior": "tarifa_junior",
  junior: "tarifa_junior",
  "habitaciones disponibles": "habitaciones_disponibles",
  rooms: "habitaciones_disponibles",
  disponibles: "habitaciones_disponibles",
  observaciones: "observaciones",
  notes: "observaciones",
  estado: "estado",
  status: "estado",
};

function normalizeHeader(h: string): string {
  const clean = h.toLowerCase().trim().replace(/\s+/g, " ");
  return COLUMN_MAP[clean] || clean;
}

function parseDate(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim();
  // Excel serial date
  if (/^\d{5}$/.test(s)) {
    const d = XLSX.SSF.parse_date_code(Number(s));
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return null;
}

function parseNum(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(String(val).replace(/[,$\s]/g, ""));
  return isNaN(n) ? null : n;
}

function normalizeRow(raw: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[normalizeHeader(k)] = v;
  }
  return {
    hotel: String(out.hotel || "").trim(),
    proveedor: String(out.proveedor || "").trim() || null,
    fecha_inicio: parseDate(out.fecha_inicio),
    fecha_fin: parseDate(out.fecha_fin),
    tipo_habitacion: String(out.tipo_habitacion || "Estándar").trim(),
    tarifa_sencilla: parseNum(out.tarifa_sencilla),
    tarifa_doble: parseNum(out.tarifa_doble),
    tarifa_triple: parseNum(out.tarifa_triple),
    tarifa_cuadruple: parseNum(out.tarifa_cuadruple),
    tarifa_primer_menor: parseNum(out.tarifa_primer_menor),
    tarifa_segundo_menor: parseNum(out.tarifa_segundo_menor),
    tarifa_junior: parseNum(out.tarifa_junior),
    habitaciones_disponibles: Math.max(0, parseInt(out.habitaciones_disponibles) || 0),
    observaciones: String(out.observaciones || "").trim() || null,
    estado: String(out.estado || "Activo").trim(),
  };
}

// ─── MODULE 1: Upload Inventory ───────────────────────────────────────────────

export async function ensureInventoryLogsTable(pool: any) {
  await pool.query(`
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
}

// ─── MODULE 6: Clip helpers ───────────────────────────────────────────────────

function verifyClipSignature(payload: string, signature: string): boolean {
  const secret = process.env.CLIP_SECRET_KEY;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function createClipCharge(opts: {
  amountCents: number;
  description: string;
  currency?: string;
  referenceId: string;
  customerEmail: string;
  customerName: string;
}) {
  const apiKey = process.env.CLIP_API_KEY;
  if (!apiKey) throw new Error("CLIP_API_KEY not configured");

  const body = {
    amount: opts.amountCents / 100,
    currency: opts.currency || "MXN",
    description: opts.description,
    idempotency_key: opts.referenceId,
    customer: { email: opts.customerEmail, name: opts.customerName },
    metadata: { reference_id: opts.referenceId },
  };

  const response = await fetch("https://api-gw.payclip.com/charges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      Accept: "application/vnd.com.payclip.v2+json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Clip API error ${response.status}: ${err}`);
  }

  return response.json();
}

// ─── MODULE 3: Deposit logic (standalone) ────────────────────────────────────

import { calculateDeposit } from "./modules/deposit.service";

// ─── REGISTER ALL OTA B2C ROUTES ─────────────────────────────────────────────

export function registerOtaB2cRoutes(app: Express) {

  // ── MODULE 3: GET /api/calculate-deposit ─────────────────────────────────

  const depositSchema = z.object({
    checkIn: z.string().min(1, "checkIn requerido"),
    total: z.number().positive("total debe ser positivo"),
  });

  app.post("/api/calculate-deposit", (req: Request, res: Response) => {
    const parsed = depositSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.errors });
    }
    const { checkIn, total } = parsed.data;
    const checkInDate = new Date(checkIn);
    if (isNaN(checkInDate.getTime())) {
      return res.status(400).json({ error: "checkIn date inválida" });
    }
    const result = calculateDeposit(checkInDate, total);
    return res.json({ checkIn, total, currency: "MXN", ...result });
  });

  // ── MODULE 1: POST /api/admin/upload-inventory ────────────────────────────

  app.post(
    "/api/admin/upload-inventory",
    requireAdmin,
    upload.single("file"),
    async (req: Request, res: Response) => {
      const file = (req as any).file;
      if (!file) return res.status(400).json({ error: "No se recibió archivo" });

      const provider = String(req.body.provider || "").trim() || undefined;
      const dryRun = req.body.dry_run === "true";

      let rows: any[] = [];
      const errors: string[] = [];

      try {
        const ext = file.originalname.toLowerCase();
        if (ext.endsWith(".csv")) {
          const text = file.buffer.toString("utf-8");
          const raw = csvParse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, any>[];
          rows = raw.map(normalizeRow);
        } else if (ext.endsWith(".xlsx") || ext.endsWith(".xls")) {
          const wb = XLSX.read(file.buffer, { type: "buffer", cellDates: false });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
          rows = raw.map(normalizeRow);
        } else {
          return res.status(400).json({ error: "Formato no soportado. Use CSV o XLSX." });
        }
      } catch (parseError: any) {
        return res.status(422).json({ error: "Error al parsear archivo", detail: parseError.message });
      }

      const validRows: any[] = [];
      rows.forEach((row, i) => {
        if (!row.hotel) { errors.push(`Fila ${i + 2}: hotel requerido`); return; }
        if (!row.fecha_inicio) { errors.push(`Fila ${i + 2}: fecha_inicio inválida`); return; }
        if (!row.fecha_fin) { errors.push(`Fila ${i + 2}: fecha_fin inválida`); return; }
        if (row.tarifa_doble === null && row.tarifa_sencilla === null) {
          errors.push(`Fila ${i + 2}: al menos tarifa_doble o tarifa_sencilla requerida`);
          return;
        }
        if (provider) row.proveedor = provider;
        validRows.push(row);
      });

      if (dryRun) {
        return res.json({
          dry_run: true,
          total: rows.length,
          valid: validRows.length,
          invalid: errors.length,
          errors: errors.slice(0, 20),
          preview: validRows.slice(0, 5),
        });
      }

      let inserted = 0, updated = 0;

      try {
        const { getPool } = await import("./db");
        const pool = getPool();
        if (!pool) return res.status(503).json({ error: "DB not available" });

        await ensureInventoryLogsTable(pool);

        for (const row of validRows) {
          try {
            const result = await pool.query(
              `INSERT INTO bloqueos (
                hotel, proveedor, fecha_inicio, fecha_fin, tipo_habitacion,
                tarifa_sencilla, tarifa_doble, tarifa_triple, tarifa_cuadruple,
                tarifa_primer_menor, tarifa_segundo_menor, tarifa_junior,
                habitaciones_disponibles, observaciones, estado, created_at
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
              ON CONFLICT (hotel, fecha_inicio, fecha_fin, tipo_habitacion)
              DO UPDATE SET
                proveedor = EXCLUDED.proveedor,
                tarifa_sencilla = EXCLUDED.tarifa_sencilla,
                tarifa_doble = EXCLUDED.tarifa_doble,
                tarifa_triple = EXCLUDED.tarifa_triple,
                tarifa_cuadruple = EXCLUDED.tarifa_cuadruple,
                tarifa_primer_menor = EXCLUDED.tarifa_primer_menor,
                tarifa_segundo_menor = EXCLUDED.tarifa_segundo_menor,
                tarifa_junior = EXCLUDED.tarifa_junior,
                habitaciones_disponibles = EXCLUDED.habitaciones_disponibles,
                observaciones = EXCLUDED.observaciones,
                estado = EXCLUDED.estado
              RETURNING (xmax = 0) AS is_insert`,
              [
                row.hotel, row.proveedor, row.fecha_inicio, row.fecha_fin, row.tipo_habitacion,
                row.tarifa_sencilla, row.tarifa_doble, row.tarifa_triple, row.tarifa_cuadruple,
                row.tarifa_primer_menor, row.tarifa_segundo_menor, row.tarifa_junior,
                row.habitaciones_disponibles, row.observaciones, row.estado || "Activo",
              ]
            );
            if (result.rows[0]?.is_insert) inserted++;
            else updated++;
          } catch (rowError: any) {
            errors.push(`Error en ${row.hotel} ${row.fecha_inicio}: ${rowError.message}`);
          }
        }

        await writeInventoryLog(pool, {
          action: "upload",
          filename: file.originalname,
          provider,
          recordsTotal: rows.length,
          recordsInserted: inserted,
          recordsUpdated: updated,
          recordsSkipped: errors.length,
          errors: errors.slice(0, 50),
          userId: req.session?.userId as string | undefined,
        });

        console.log(`[Inventory Upload] ${file.originalname} | +${inserted} inserted, ~${updated} updated, ${errors.length} errors`);

        return res.status(201).json({
          success: true,
          filename: file.originalname,
          provider,
          records_total: rows.length,
          records_inserted: inserted,
          records_updated: updated,
          records_skipped: rows.length - validRows.length,
          errors: errors.slice(0, 20),
        });
      } catch (dbError: any) {
        console.error("[Inventory Upload] DB error:", dbError);
        return res.status(500).json({ error: "Error de base de datos", detail: dbError.message });
      }
    }
  );

  // Add UNIQUE constraint support for UPSERT (run once idempotently)
  app.post("/api/admin/inventory/ensure-index", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "DB not available" });
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS bloqueos_upsert_key
        ON bloqueos (hotel, fecha_inicio, fecha_fin, tipo_habitacion)
      `);
      await ensureInventoryLogsTable(pool);
      res.json({ success: true, message: "Índice y tabla inventory_logs creados" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/admin/inventory/logs
  app.get("/api/admin/inventory/logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "DB not available" });
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const result = await pool.query(
        `SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT $1`, [limit]
      );
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── MODULE 6: Clip Payments ───────────────────────────────────────────────

  const clipSessionSchema = z.object({
    leadId: z.string().uuid(),
    totalAmount: z.number().positive(),
    depositPercent: z.number().min(20).max(100),
    hotel: z.string().min(1),
    checkIn: z.string().min(1),
    checkOut: z.string().min(1),
    customerEmail: z.string().email(),
    customerName: z.string().min(2),
  });

  app.post("/api/payments/clip/session", async (req: Request, res: Response) => {
    const parsed = clipSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.errors });
    }

    const data = parsed.data;
    const hotel = sanitizeInput(data.hotel);
    const customerName = sanitizeInput(data.customerName);
    const depositAmount = Math.ceil(data.totalAmount * data.depositPercent / 100);
    const amountCents = Math.round(depositAmount * 100);
    const referenceId = `${data.leadId.substring(0, 8).toUpperCase()}-${Date.now()}`;

    try {
      const charge = await createClipCharge({
        amountCents,
        description: `Anticipo ${hotel} ${data.checkIn} - ${data.checkOut}`,
        referenceId,
        customerEmail: data.customerEmail,
        customerName,
        currency: "MXN",
      });

      const { getPool } = await import("./db");
      const pool = getPool();
      if (pool) {
        await pool.query(
          `INSERT INTO clip_payment_intents (lead_id, charge_id, reference_id, amount_cents, status, raw_response, created_at)
           VALUES ($1,$2,$3,$4,'pending',$5,NOW())
           ON CONFLICT (reference_id) DO NOTHING`,
          [data.leadId, charge.id || charge.charge_id, referenceId, amountCents, JSON.stringify(charge)]
        );
      }

      console.log(`[Clip] Session created | ${referenceId} | MXN ${depositAmount}`);

      return res.json({
        success: true,
        chargeId: charge.id || charge.charge_id,
        referenceId,
        amount: depositAmount,
        currency: "MXN",
        paymentUrl: charge.payment_request_url || charge.checkout_url || null,
        raw: charge,
      });
    } catch (e: any) {
      console.error("[Clip] Session error:", e.message);
      return res.status(502).json({ error: "Error al crear sesión de pago Clip", detail: e.message });
    }
  });

  // Clip Webhook (raw body needed for signature verification)
  app.post(
    "/api/webhooks/clip",
    (req: any, res: Response, next: any) => {
      let data = "";
      req.setEncoding("utf8");
      req.on("data", (chunk: string) => { data += chunk; });
      req.on("end", () => { req.rawBody = data; next(); });
    },
    async (req: any, res: Response) => {
      const signature = req.headers["x-clip-signature"] as string || "";
      const rawBody = req.rawBody || "";

      if (!verifyClipSignature(rawBody, signature)) {
        console.warn("[Clip Webhook] Invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      let event: any;
      try { event = JSON.parse(rawBody); } catch {
        return res.status(400).json({ error: "Invalid JSON payload" });
      }

      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "DB unavailable" });

      const chargeId = event.id || event.charge_id;
      const status = event.status || event.payment_status;

      try {
        if (status === "PAID" || status === "APPROVED") {
          await pool.query(
            `UPDATE clip_payment_intents SET status='paid', paid_at=NOW(), raw_webhook=$1 WHERE charge_id=$2`,
            [JSON.stringify(event), chargeId]
          );

          const intentResult = await pool.query(
            `SELECT lead_id FROM clip_payment_intents WHERE charge_id=$1`, [chargeId]
          );

          if (intentResult.rows.length > 0) {
            const leadId = intentResult.rows[0].lead_id;
            await pool.query(
              `UPDATE leads SET status='converted', converted_at=NOW() WHERE id=$1`, [leadId]
            );

            // Confirmar la reserva asociada (reference = primeros 8 chars del lead.id)
            try {
              const reservaRef = String(leadId).substring(0, 8).toUpperCase();
              const confirmResult = await pool.query(
                `UPDATE reservas SET status='confirmed', confirmed_at=NOW()
                 WHERE reference=$1 AND status IN ('hold','pending_payment')
                 RETURNING id`,
                [reservaRef]
              );
              if (confirmResult.rows.length > 0) {
                console.log(`[Clip Webhook] Reserva confirmada | ref:${reservaRef} | id:${confirmResult.rows[0].id}`);
              }
            } catch (rsvErr: any) {
              console.error('[Clip Webhook] reserva confirm non-fatal:', rsvErr.message);
            }

            const { auditService } = await import("./services/audit.service");
            await auditService.log("payment_created", "payment", leadId, null, {
              chargeId, amount: event.amount, currency: "MXN", status, source: "clip",
            }, {});

            console.log(`[Clip Webhook] Payment confirmed | lead:${leadId} | charge:${chargeId}`);
          }
        } else if (status === "FAILED" || status === "CANCELLED") {
          await pool.query(
            `UPDATE clip_payment_intents SET status=$1, raw_webhook=$2 WHERE charge_id=$3`,
            [status.toLowerCase(), JSON.stringify(event), chargeId]
          );
        }

        res.json({ received: true, chargeId, status });
      } catch (e: any) {
        console.error("[Clip Webhook] Processing error:", e.message);
        res.status(500).json({ error: "Webhook processing error" });
      }
    }
  );

  // Ensure Clip tables exist (run once)
  app.post("/api/admin/clip/ensure-tables", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "DB unavailable" });
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clip_payment_intents (
          id SERIAL PRIMARY KEY,
          lead_id VARCHAR(255) NOT NULL,
          charge_id VARCHAR(255),
          reference_id VARCHAR(255) UNIQUE NOT NULL,
          amount_cents INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          paid_at TIMESTAMP,
          raw_response JSONB,
          raw_webhook JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      res.json({ success: true, message: "Tabla clip_payment_intents creada" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── MODULE 7: Social Share iFrame ─────────────────────────────────────────

  app.get("/api/share/:blockId", async (req: Request, res: Response) => {
    try {
      const { getPool } = await import("./db");
      const pool = getPool();

      let bloqueo: any = null;

      if (pool) {
        const isNumeric = /^\d+$/.test(req.params.blockId);
        const whereClause = isNumeric
          ? "WHERE id = $1 AND estado = 'Activo'"
          : "WHERE hotel ILIKE $1 AND estado = 'Activo' ORDER BY tarifa_doble ASC LIMIT 1";
        const param = isNumeric ? req.params.blockId : `%${req.params.blockId}%`;
        const result = await pool.query(
          `SELECT id, hotel, tipo_habitacion, fecha_inicio, fecha_fin,
                  tarifa_doble, tarifa_sencilla, habitaciones_disponibles
           FROM bloqueos ${whereClause}`,
          [param]
        );
        bloqueo = result.rows[0];
      }

      if (!bloqueo) {
        return res.status(404).send(`<html><body style="font-family:sans-serif;text-align:center;padding:2rem"><h2>Oferta no encontrada</h2></body></html>`);
      }

      const price = parseFloat(bloqueo.tarifa_doble || bloqueo.tarifa_sencilla || "0");
      const formatMXN = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;

      const ci = new Date(bloqueo.fecha_inicio + "T12:00:00");
      const co = new Date(bloqueo.fecha_fin + "T12:00:00");
      const nights = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));

      const fmtDate = (d: Date) => d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

      const baseUrl = process.env.BASE_URL || "https://chromatravel.online";
      const shareUrl = `${baseUrl}/ofertas?hotel=${encodeURIComponent(bloqueo.hotel)}`;
      const ogImage = `${baseUrl}/assets/kueani-logo.png`;

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bloqueo.hotel} — ${formatMXN(price)}</title>
  <meta name="description" content="Tarifa especial: ${bloqueo.hotel} ${bloqueo.tipo_habitacion} — ${formatMXN(price)} · ${nights} noches · ${fmtDate(ci)} al ${fmtDate(co)}">
  <meta property="og:title" content="🏨 ${bloqueo.hotel} — ${formatMXN(price)}">
  <meta property="og:description" content="${bloqueo.tipo_habitacion} · ${nights} noches · ${fmtDate(ci)} al ${fmtDate(co)} · Disponibilidad limitada">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:type" content="product">
  <meta property="og:locale" content="es_MX">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="🏨 ${bloqueo.hotel} — ${formatMXN(price)}">
  <meta name="twitter:description" content="${bloqueo.tipo_habitacion} · ${nights} noches desde ${fmtDate(ci)}">
  <meta name="twitter:image" content="${ogImage}">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
    .card{background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:1.5rem;max-width:420px;width:100%;color:white;box-shadow:0 25px 50px rgba(0,0,0,.5)}
    .badge{display:inline-flex;align-items:center;gap:.4rem;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#10b981;border-radius:999px;padding:.25rem .75rem;font-size:.75rem;font-weight:600;margin-bottom:1rem}
    .hotel{font-size:1.25rem;font-weight:700;line-height:1.3;margin-bottom:.25rem}
    .room{color:#94a3b8;font-size:.875rem;margin-bottom:1rem}
    .dates{display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1.25rem}
    .date-item{background:rgba(255,255,255,.05);border-radius:8px;padding:.5rem .75rem;font-size:.8rem}
    .date-label{color:#64748b;display:block;margin-bottom:.15rem}
    .date-val{color:#e2e8f0;font-weight:600}
    .price-row{display:flex;align-items:flex-end;justify-content:space-between;border-top:1px solid rgba(255,255,255,.08);padding-top:1.25rem;margin-top:.5rem}
    .price-label{color:#94a3b8;font-size:.75rem;margin-bottom:.2rem}
    .price{font-size:1.75rem;font-weight:800;color:#10b981}
    .avail{font-size:.8rem;color:#f59e0b;font-weight:500}
    .cta{display:block;margin-top:1rem;background:linear-gradient(135deg,#10b981,#6366f1);color:white;text-align:center;padding:.75rem;border-radius:10px;text-decoration:none;font-weight:600;font-size:.9rem}
    .cta:hover{opacity:.9}
    .brand{text-align:center;margin-top:.75rem;color:#475569;font-size:.7rem}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🔥 Tarifa Especial</div>
    <div class="hotel">${bloqueo.hotel}</div>
    <div class="room">${bloqueo.tipo_habitacion}</div>
    <div class="dates">
      <div class="date-item">
        <span class="date-label">Check-in</span>
        <span class="date-val">${fmtDate(ci)}</span>
      </div>
      <div class="date-item">
        <span class="date-label">Check-out</span>
        <span class="date-val">${fmtDate(co)}</span>
      </div>
      <div class="date-item">
        <span class="date-label">Noches</span>
        <span class="date-val">${nights}</span>
      </div>
    </div>
    <div class="price-row">
      <div>
        <div class="price-label">Precio por persona (doble)</div>
        <div class="price">${formatMXN(price)}</div>
        ${bloqueo.habitaciones_disponibles <= 5 ? `<div class="avail">⚡ Solo ${bloqueo.habitaciones_disponibles} habitaciones</div>` : ""}
      </div>
    </div>
    <a href="${shareUrl}" class="cta" target="_blank" rel="noopener">Ver disponibilidad →</a>
    <div class="brand">${(req as any).brand?.domain ?? "chromatravel.online"} · ${(req as any).brand?.name ?? "Tarifas Negociadas Exclusivas"}</div>
  </div>
</body>
</html>`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Frame-Options", "ALLOWALL");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.send(html);
    } catch (e: any) {
      console.error("[Share iFrame] Error:", e.message);
      return res.status(500).send(`<html><body>Error: ${e.message}</body></html>`);
    }
  });

  // ── MODULE 8: Agency/B2B Toggle ───────────────────────────────────────────

  const agencyToggleSchema = z.object({
    isAgency: z.boolean(),
    commissionPercent: z.number().min(0).max(30).optional().default(10),
    netRateAccess: z.boolean().optional().default(false),
    agencyName: z.string().max(200).optional(),
  });

  app.patch("/api/admin/users/:id/agency", requireAdmin, async (req: Request, res: Response) => {
    const parsed = agencyToggleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos inválidos", details: parsed.error.errors });
    }

    try {
      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "DB unavailable" });

      await pool.query(`
        CREATE TABLE IF NOT EXISTS agency_profiles (
          user_id VARCHAR(255) PRIMARY KEY,
          agency_name TEXT,
          commission_percent NUMERIC(5,2) DEFAULT 10,
          net_rate_access BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const data = parsed.data;

      if (data.isAgency) {
        await pool.query(
          `INSERT INTO agency_profiles (user_id, agency_name, commission_percent, net_rate_access, is_active, updated_at)
           VALUES ($1, $2, $3, $4, TRUE, NOW())
           ON CONFLICT (user_id) DO UPDATE SET
             agency_name = EXCLUDED.agency_name,
             commission_percent = EXCLUDED.commission_percent,
             net_rate_access = EXCLUDED.net_rate_access,
             is_active = TRUE,
             updated_at = NOW()`,
          [req.params.id, data.agencyName || null, data.commissionPercent, data.netRateAccess]
        );

        await pool.query(
          `UPDATE users SET role = 'agent' WHERE id = $1 AND role = 'customer'`,
          [req.params.id]
        );
      } else {
        await pool.query(
          `UPDATE agency_profiles SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1`,
          [req.params.id]
        );
      }

      const { auditService } = await import("./services/audit.service");
      await auditService.log(
        "admin_update",
        "user", req.params.id, null,
        { agencyToggle: data.isAgency ? "enabled" : "disabled", ...data, adminId: req.session?.userId }, {}
      );

      return res.json({
        success: true,
        userId: req.params.id,
        isAgency: data.isAgency,
        commissionPercent: data.commissionPercent,
        netRateAccess: data.netRateAccess,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // GET agency profile
  app.get("/api/admin/users/:id/agency", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "DB unavailable" });
      const result = await pool.query(
        `SELECT * FROM agency_profiles WHERE user_id = $1`, [req.params.id]
      );
      if (result.rows.length === 0) {
        return res.json({ userId: req.params.id, isAgency: false });
      }
      return res.json({ userId: req.params.id, isAgency: result.rows[0].is_active, ...result.rows[0] });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // GET agency price for a bloqueo (applies commission as NET rate)
  app.get("/api/bloqueos/:id/agency-price", async (req: any, res: Response) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });

      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "DB unavailable" });

      const [bloqueoResult, agencyResult] = await Promise.all([
        pool.query(`SELECT * FROM bloqueos WHERE id = $1 AND estado = 'Activo'`, [req.params.id]),
        pool.query(`SELECT * FROM agency_profiles WHERE user_id = $1 AND is_active = TRUE`, [req.session.userId]),
      ]);

      if (bloqueoResult.rows.length === 0) return res.status(404).json({ error: "Bloqueo no encontrado" });

      const bloqueo = bloqueoResult.rows[0];
      const agency = agencyResult.rows[0];

      if (!agency) {
        return res.status(403).json({ error: "Perfil de agencia no activo" });
      }

      const commPct = parseFloat(agency.commission_percent) || 10;
      const applyDiscount = (price: any) => {
        if (!price) return null;
        const n = parseFloat(price);
        return Math.round(n * (1 - commPct / 100) * 100) / 100;
      };

      return res.json({
        bloqueoId: bloqueo.id,
        hotel: bloqueo.hotel,
        agencyName: agency.agency_name,
        commissionPercent: commPct,
        publicPrices: {
          sgl: bloqueo.tarifa_sencilla,
          dbl: bloqueo.tarifa_doble,
          tpl: bloqueo.tarifa_triple,
          quad: bloqueo.tarifa_cuadruple,
        },
        netPrices: {
          sgl: applyDiscount(bloqueo.tarifa_sencilla),
          dbl: applyDiscount(bloqueo.tarifa_doble),
          tpl: applyDiscount(bloqueo.tarifa_triple),
          quad: applyDiscount(bloqueo.tarifa_cuadruple),
        },
        netRateAccess: agency.net_rate_access,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  console.log("[OTA B2C] Routes registered: upload-inventory, calculate-deposit, clip, share, agency");
}
