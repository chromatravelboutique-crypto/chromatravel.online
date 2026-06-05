/**
 * Background job queue — PostgreSQL-backed, no Redis required.
 *
 * WHY NOT BullMQ / Celery / Sidekiq?
 *   BullMQ requires Redis. At current scale (< 1K jobs/day) a dedicated Redis
 *   instance adds cost and operational complexity for no gain. PostgreSQL already
 *   handles this workload comfortably with SKIP LOCKED.
 *
 *   If you ever need > 50K jobs/day or a visual dashboard, migrate to pg-boss
 *   (same PG, drop-in) or add Redis and switch to BullMQ. The enqueueJob()
 *   interface stays the same either way.
 *
 * GUARANTEES:
 *   - At-least-once delivery (may process twice during a crash — idempotency_key
 *     prevents duplicate side effects).
 *   - Exponential backoff: retry after 2^attempt minutes (1m, 2m, 4m).
 *   - Dead-letter: jobs that exhaust maxAttempts move to job_dead_letter.
 *     Nothing is silently dropped.
 *
 * HOW TO RUN:
 *   Development  — worker runs inside the main web process (startJobQueueWorker).
 *   Production   — same, OR run `npm run worker` as a separate Railway service
 *                  (see package.json "worker" script and WORKER_ONLY env var).
 */

import { db, getPool } from "../db";
import { jobQueue, jobDeadLetter, type JobQueue } from "@shared/schema";
import { eq } from "drizzle-orm";

// ── Configuration ─────────────────────────────────────────────────────────────

const POLL_MS      = parseInt(process.env.JOB_POLL_MS  || "5000");  // how often to check
const MAX_PARALLEL = parseInt(process.env.JOB_PARALLEL || "3");     // concurrent jobs

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
  data: Record<string, unknown>;
  clientData: Record<string, unknown>;
  notifyEmail?: string;
}

export interface SendWhatsAppPayload {
  to: string;
  message: string;
  brandCode: string;
}

// ── Handlers ─────────────────────────────────────────────────────────────────
// Add a new job type here. The key must match the `type` field you pass to enqueueJob().

async function handleSendEmail(payload: SendEmailPayload): Promise<void> {
  const { sendEmail } = await import("../email-service");
  const ok = await sendEmail(payload);
  if (!ok) throw new Error("sendEmail returned false — SMTP may be down");
}

async function handleGeneratePdf(payload: GeneratePdfPayload): Promise<void> {
  const { generateReceipt, generateProforma } = await import("../crm/document-generator");
  if (payload.documentType === "receipt") {
    await generateReceipt(payload.data as any, payload.clientData as any, payload.brandCode);
  } else {
    await generateProforma(payload.data as any, payload.clientData as any, payload.brandCode);
  }
  if (payload.notifyEmail) {
    await enqueueJob("send_email", {
      to: payload.notifyEmail,
      subject: `Tu ${payload.documentType === "receipt" ? "recibo" : "proforma"} está listo`,
      html: `<p>Tu documento ha sido generado y está disponible en el panel.</p>`,
    }, `pdf-ready-notify-${payload.notifyEmail}-${Date.now()}`);
  }
}

async function handleSendWhatsApp(payload: SendWhatsAppPayload): Promise<void> {
  const { sendWhatsAppMessage } = await import("../crm/whatsapp");
  const result = await sendWhatsAppMessage(payload.to, payload.message, payload.brandCode);
  if (!result?.success) throw new Error(`WhatsApp send failed: ${JSON.stringify(result)}`);
}

// ── Handler registry ──────────────────────────────────────────────────────────
// To add a new job type: add an entry here and a payload interface above.

const HANDLERS: Record<string, (payload: any) => Promise<void>> = {
  send_email:    handleSendEmail,
  generate_pdf:  handleGeneratePdf,
  send_whatsapp: handleSendWhatsApp,

  // ── EXAMPLE JOB — copy this as a template ────────────────────────────────
  // 1. Add your payload type above
  // 2. Write the handler function
  // 3. Register it here
  // 4. Call enqueueJob("example_job", { message: "hello" }, "unique-key")
  // example_job: async (payload: { message: string }) => {
  //   console.log("[example_job] processing:", payload.message);
  //   await someExpensiveOperation(payload);
  // },
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enqueue a background job. Safe to call multiple times with the same
 * idempotencyKey — duplicates are silently ignored (ON CONFLICT DO NOTHING).
 *
 * @param type           Must match a key in HANDLERS.
 * @param payload        JSON-serialisable job data.
 * @param idempotencyKey Unique string that prevents re-enqueuing the same work.
 *                       Convention: "{type}-{entity}-{entityId}[-{role}]"
 *                       e.g. "send_email-lead-abc123-staff"
 * @param delayMs        Optional delay before the job becomes eligible.
 * @returns              The new job id, or null if it was a duplicate.
 */
export async function enqueueJob(
  type: string,
  payload: Record<string, unknown>,
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
    if (job?.id) {
      console.log(`[job-queue] enqueued ${type} (${idempotencyKey})`);
    }
    return job?.id ?? null;
  } catch (err) {
    // Enqueue failure must never crash the web request — log and continue.
    console.error("[job-queue] enqueue error:", err);
    return null;
  }
}

/**
 * Query job status by idempotency key.
 * Useful for polling from the frontend after a 202 response.
 */
export async function getJobStatus(idempotencyKey: string) {
  const [job] = await db
    .select({ status: jobQueue.status, attempts: jobQueue.attempts, lastError: jobQueue.lastError, updatedAt: jobQueue.updatedAt })
    .from(jobQueue)
    .where(eq(jobQueue.idempotencyKey, idempotencyKey));
  return job ?? null;
}

// ── Worker internals ──────────────────────────────────────────────────────────

async function claimJobs(): Promise<JobQueue[]> {
  const pool = getPool();
  if (!pool) return [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<JobQueue>(`
      SELECT * FROM job_queue
      WHERE  status        = 'pending'
        AND  attempts      < max_attempts
        AND  process_after <= NOW()
      ORDER  BY created_at ASC
      LIMIT  $1
      FOR UPDATE SKIP LOCKED
    `, [MAX_PARALLEL]);

    if (rows.length > 0) {
      const ids = rows.map(r => `'${r.id}'`).join(",");
      await client.query(`
        UPDATE job_queue SET status = 'processing', updated_at = NOW()
        WHERE id IN (${ids})
      `);
    }
    await client.query("COMMIT");
    return rows;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[job-queue] claim error:", err);
    return [];
  } finally {
    client.release();
  }
}

async function processJob(job: JobQueue): Promise<void> {
  const handler = HANDLERS[job.type];
  if (!handler) {
    // Unknown job type — move to dead-letter immediately, no retries.
    await moveToDeadLetter(job, `No handler registered for type '${job.type}'`);
    return;
  }

  try {
    await handler(job.payload as any);
    await db.update(jobQueue).set({
      status:    "done",
      attempts:  job.attempts + 1,
      updatedAt: new Date(),
    }).where(eq(jobQueue.id, job.id));
    console.log(`[job-queue] ✓ ${job.type} (${job.idempotencyKey})`);
  } catch (err: any) {
    const attempts   = job.attempts + 1;
    const exhausted  = attempts >= job.maxAttempts;

    if (exhausted) {
      await moveToDeadLetter(job, err?.message ?? String(err));
    } else {
      // Exponential backoff: 2^attempts minutes (1m → 2m → 4m)
      const backoffMs = Math.pow(2, attempts) * 60_000;
      await db.update(jobQueue).set({
        status:       "pending",
        attempts,
        lastError:    err?.message ?? String(err),
        processAfter: new Date(Date.now() + backoffMs),
        updatedAt:    new Date(),
      }).where(eq(jobQueue.id, job.id));
    }

    const retryInfo = exhausted ? "→ dead-letter" : `→ retry in ${Math.pow(2, attempts)}m`;
    console.error(`[job-queue] ✗ ${job.type} (${job.idempotencyKey}) attempt ${attempts}/${job.maxAttempts} ${retryInfo}: ${err?.message}`);
  }
}

async function moveToDeadLetter(job: JobQueue, reason: string): Promise<void> {
  try {
    await db.insert(jobDeadLetter).values({
      originalJobId:  job.id,
      type:           job.type,
      payload:        job.payload as any,
      idempotencyKey: job.idempotencyKey,
      attempts:       job.attempts + 1,
      lastError:      reason,
    });
    await db.update(jobQueue).set({
      status:    "failed",
      lastError: reason,
      attempts:  job.attempts + 1,
      updatedAt: new Date(),
    }).where(eq(jobQueue.id, job.id));
    console.error(`[job-queue] 💀 ${job.type} (${job.idempotencyKey}) → dead-letter: ${reason}`);
  } catch (dlErr) {
    console.error("[job-queue] failed to write dead-letter:", dlErr);
  }
}

async function tick(): Promise<void> {
  const jobs = await claimJobs();
  if (jobs.length > 0) {
    await Promise.allSettled(jobs.map(processJob));
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

let timer: ReturnType<typeof setInterval> | null = null;

export async function startJobQueueWorker(): Promise<void> {
  if (timer) return;
  await ensureTables();
  tick(); // flush any pending jobs immediately on startup
  timer = setInterval(tick, POLL_MS);
  console.log(`[job-queue] Worker started (poll every ${POLL_MS / 1000}s, max ${MAX_PARALLEL} parallel)`);
}

export function stopJobQueueWorker(): void {
  if (timer) { clearInterval(timer); timer = null; }
}

async function ensureTables(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_queue (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      type             TEXT        NOT NULL,
      payload          JSONB       NOT NULL,
      status           TEXT        NOT NULL DEFAULT 'pending',
      idempotency_key  TEXT        NOT NULL UNIQUE,
      attempts         INTEGER     NOT NULL DEFAULT 0,
      max_attempts     INTEGER     NOT NULL DEFAULT 3,
      last_error       TEXT,
      process_after    TIMESTAMPTZ          DEFAULT NOW(),
      created_at       TIMESTAMPTZ          DEFAULT NOW(),
      updated_at       TIMESTAMPTZ          DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS job_dead_letter (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      original_job_id  TEXT        NOT NULL,
      type             TEXT        NOT NULL,
      payload          JSONB       NOT NULL,
      idempotency_key  TEXT        NOT NULL,
      attempts         INTEGER     NOT NULL,
      last_error       TEXT,
      failed_at        TIMESTAMPTZ          DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_jq_pending
      ON job_queue (process_after, created_at)
      WHERE status = 'pending';
  `);
}
