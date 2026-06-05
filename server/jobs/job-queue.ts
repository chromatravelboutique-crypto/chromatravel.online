/**
 * Persistent background job queue backed by PostgreSQL.
 *
 * Design decisions:
 * - No external dependencies (no Redis, no BullMQ). Uses the existing pg pool.
 * - idempotency_key prevents duplicate side effects (email sent twice, etc.)
 * - Exponential backoff: attempt N waits 2^N minutes before retry.
 * - Worker polls every POLL_INTERVAL_MS; safe to run in the main process.
 * - To add a new job type: add a handler to HANDLERS below.
 */

import { db, getPool } from "../db";
import { jobQueue, type JobQueue } from "@shared/schema";
import { eq, and, lte, lt, inArray, sql } from "drizzle-orm";

const POLL_INTERVAL_MS = 5_000;   // poll every 5 s
const LOCK_TIMEOUT_MS  = 60_000;  // give up processing a job after 60 s
const MAX_CONCURRENT   = 3;       // max jobs processed in parallel

// ── Job payload types ─────────────────────────────────────────────────────────

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface GeneratePdfPayload {
  documentType: "receipt" | "proforma";
  brandCode: string;
  /** Serialised ReceiptData or ProformaData */
  data: Record<string, unknown>;
  clientData: Record<string, unknown>;
  /** Where to notify when done (optional) */
  notifyEmail?: string;
}

export interface SendWhatsAppPayload {
  to: string;
  message: string;
  brandCode: string;
}

type JobPayload = SendEmailPayload | GeneratePdfPayload | SendWhatsAppPayload;

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleSendEmail(payload: SendEmailPayload): Promise<void> {
  const { sendEmail } = await import("../email-service");
  const ok = await sendEmail(payload);
  if (!ok) throw new Error("sendEmail returned false — SMTP may be down");
}

async function handleGeneratePdf(payload: GeneratePdfPayload): Promise<void> {
  const { generateReceipt, generateProforma } = await import("../crm/document-generator");
  if (payload.documentType === "receipt") {
    await generateReceipt(
      payload.data as any,
      payload.clientData as any,
      payload.brandCode,
    );
  } else {
    await generateProforma(
      payload.data as any,
      payload.clientData as any,
      payload.brandCode,
    );
  }
  // If a notification email was requested, enqueue it now
  if (payload.notifyEmail) {
    await enqueueJob("send_email", {
      to: payload.notifyEmail,
      subject: "Tu documento está listo",
      html: `<p>Tu ${payload.documentType === "receipt" ? "recibo" : "proforma"} ha sido generado y está disponible en el panel.</p>`,
    }, `pdf-ready-notify-${payload.notifyEmail}-${Date.now()}`);
  }
}

async function handleSendWhatsApp(payload: SendWhatsAppPayload): Promise<void> {
  const { sendWhatsAppMessage } = await import("../crm/whatsapp");
  const result = await sendWhatsAppMessage(payload.to, payload.message, payload.brandCode);
  if (!result?.success) throw new Error(`WhatsApp send failed: ${JSON.stringify(result)}`);
}

const HANDLERS: Record<string, (payload: any) => Promise<void>> = {
  send_email:     handleSendEmail,
  generate_pdf:   handleGeneratePdf,
  send_whatsapp:  handleSendWhatsApp,
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enqueue a job. Idempotent: if idempotencyKey already exists the call is a no-op.
 *
 * @param type          Job type — must match a key in HANDLERS
 * @param payload       Serialisable job data
 * @param idempotencyKey Unique key that prevents re-enqueuing the same logical work.
 *                       Callers are responsible for building a meaningful key,
 *                       e.g. `email-lead-${leadId}-staff` or `pdf-receipt-${paymentId}`.
 * @param delayMs       Optional delay before the job is eligible to run
 */
export async function enqueueJob(
  type: string,
  payload: JobPayload | Record<string, unknown>,
  idempotencyKey: string,
  delayMs = 0,
): Promise<string | null> {
  const processAfter = new Date(Date.now() + delayMs);
  try {
    const [job] = await db
      .insert(jobQueue)
      .values({ type, payload, idempotencyKey, processAfter })
      .onConflictDoNothing({ target: jobQueue.idempotencyKey })
      .returning({ id: jobQueue.id });
    return job?.id ?? null; // null means it was a duplicate — safely ignored
  } catch (err) {
    console.error("[job-queue] enqueue error:", err);
    return null;
  }
}

// ── Worker internals ──────────────────────────────────────────────────────────

async function claimAndProcess(): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  // Claim up to MAX_CONCURRENT pending jobs atomically with a SELECT FOR UPDATE SKIP LOCKED
  const client = await pool.connect();
  let jobs: JobQueue[] = [];
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<JobQueue>(
      `SELECT * FROM job_queue
       WHERE status = 'pending'
         AND attempts < max_attempts
         AND process_after <= NOW()
       ORDER BY created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [MAX_CONCURRENT],
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return;
    }
    const ids = rows.map(r => `'${r.id}'`).join(",");
    await client.query(
      `UPDATE job_queue SET status = 'processing', updated_at = NOW() WHERE id IN (${ids})`,
    );
    await client.query("COMMIT");
    jobs = rows;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[job-queue] claim error:", err);
  } finally {
    client.release();
  }

  // Process claimed jobs concurrently
  await Promise.allSettled(jobs.map(processJob));
}

async function processJob(job: JobQueue): Promise<void> {
  const handler = HANDLERS[job.type];
  if (!handler) {
    await db.update(jobQueue).set({
      status: "failed",
      lastError: `No handler registered for type '${job.type}'`,
      updatedAt: new Date(),
    }).where(eq(jobQueue.id, job.id));
    return;
  }

  try {
    await handler(job.payload as any);
    await db.update(jobQueue).set({
      status: "done",
      attempts: job.attempts + 1,
      updatedAt: new Date(),
    }).where(eq(jobQueue.id, job.id));
    console.log(`[job-queue] ✓ ${job.type} (${job.id.slice(0, 8)})`);
  } catch (err: any) {
    const attempts = job.attempts + 1;
    const failed   = attempts >= job.maxAttempts;
    // Exponential backoff: retry after 2^attempts minutes (1m, 2m, 4m)
    const retryAfter = new Date(Date.now() + Math.pow(2, attempts) * 60_000);
    await db.update(jobQueue).set({
      status:       failed ? "failed" : "pending",
      attempts,
      lastError:    err?.message ?? String(err),
      processAfter: failed ? undefined : retryAfter,
      updatedAt:    new Date(),
    }).where(eq(jobQueue.id, job.id));
    console.error(
      `[job-queue] ✗ ${job.type} (${job.id.slice(0, 8)}) attempt ${attempts}/${job.maxAttempts}: ${err?.message}`,
    );
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

let workerTimer: ReturnType<typeof setInterval> | null = null;

export function startJobQueueWorker(): void {
  if (workerTimer) return;
  // Ensure table exists (idempotent — Drizzle push handles migrations, this is a safety net)
  ensureTable().then(() => {
    claimAndProcess(); // run immediately on startup to flush any pending jobs
    workerTimer = setInterval(claimAndProcess, POLL_INTERVAL_MS);
    console.log("[job-queue] Worker started — polling every 5s");
  }).catch(err => console.error("[job-queue] Failed to ensure table:", err));
}

export function stopJobQueueWorker(): void {
  if (workerTimer) { clearInterval(workerTimer); workerTimer = null; }
}

async function ensureTable(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_queue (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      type             TEXT NOT NULL,
      payload          JSONB NOT NULL,
      status           TEXT NOT NULL DEFAULT 'pending',
      idempotency_key  TEXT NOT NULL UNIQUE,
      attempts         INTEGER NOT NULL DEFAULT 0,
      max_attempts     INTEGER NOT NULL DEFAULT 3,
      last_error       TEXT,
      process_after    TIMESTAMPTZ DEFAULT NOW(),
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_job_queue_pending
      ON job_queue (status, process_after, created_at)
      WHERE status = 'pending';
  `);
}
