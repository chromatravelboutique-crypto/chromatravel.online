/**
 * Standalone worker entry point.
 *
 * Run with:
 *   Development:  npx tsx server/worker.ts
 *   Production:   node dist/worker.cjs
 *
 * In Railway: create a second service pointing to the same repo,
 * set its start command to `npm run worker`, and it shares the same DB.
 * No Redis, no extra infrastructure.
 */

import "dotenv/config";
import { startJobQueueWorker, stopJobQueueWorker } from "./jobs/job-queue";

console.log("[worker] Starting background job worker...");
console.log(`[worker] NODE_ENV=${process.env.NODE_ENV}`);

startJobQueueWorker().catch((err) => {
  console.error("[worker] Failed to start:", err);
  process.exit(1);
});

// Graceful shutdown — finish in-flight jobs before exiting
function shutdown(signal: string) {
  console.log(`[worker] ${signal} received, stopping worker...`);
  stopJobQueueWorker();
  // Give in-flight jobs up to 30s to complete
  setTimeout(() => {
    console.log("[worker] Clean shutdown");
    process.exit(0);
  }, 30_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  console.error("[worker] Uncaught exception:", err);
  // Don't exit — let the worker keep running for other jobs
});
process.on("unhandledRejection", (reason) => {
  console.error("[worker] Unhandled rejection:", reason);
});
