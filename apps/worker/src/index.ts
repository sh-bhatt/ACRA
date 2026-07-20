import "dotenv/config";

import { getWorkerEnvironment } from "./config/env.js";
import { createWorkerSupabaseClient } from "./lib/supabase.js";
import { claimAndInspectReviewAnalysisJob } from "./queue/review-analysis-job.js";

const FALLBACK_WORKER_NAME =
  "acra-analysis-worker";

let activeWorkerName = FALLBACK_WORKER_NAME;

function shutdown(signal: string): void {
  console.log(
    `[${activeWorkerName}] received ${signal}`,
  );

  console.log(
    `[${activeWorkerName}] shutting down safely`,
  );

  process.stdin.pause();
  process.exitCode = 0;
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

async function main(): Promise<void> {
  const environment = getWorkerEnvironment();

  activeWorkerName = environment.WORKER_ID;

  console.log(
    `[${activeWorkerName}] started successfully`,
  );

  console.log(
    `[${activeWorkerName}] connecting to Supabase`,
  );

  const supabase =
    createWorkerSupabaseClient(environment);

  await claimAndInspectReviewAnalysisJob(
    supabase,
  );

  console.log(
    `[${activeWorkerName}] controlled inspection finished`,
  );

  console.log(
    `[${activeWorkerName}] waiting for shutdown`,
  );

  // Temporary only. Continuous polling comes later.
  process.stdin.resume();
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown worker startup error";

  console.error(
    `[${activeWorkerName}] startup failed: ${message}`,
  );

  process.exitCode = 1;
});