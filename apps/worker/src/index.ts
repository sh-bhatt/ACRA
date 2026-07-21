import "dotenv/config";

import { getWorkerEnvironment } from "./config/env.js";
import { createWorkerSupabaseClient } from "./lib/supabase.js";
import { pollReviewAnalysisQueue } from "./queue/poll-review-analysis-queue.js";

const FALLBACK_WORKER_NAME =
  "acra-analysis-worker";

let activeWorkerName =
  FALLBACK_WORKER_NAME;

let shutdownRequested = false;

const shutdownController =
  new AbortController();

function requestShutdown(
  signal: string,
): void {
  if (shutdownRequested) {
    return;
  }

  shutdownRequested = true;

  console.log(
    `[${activeWorkerName}] received ${signal}`,
  );

  console.log(
    [
      `[${activeWorkerName}] graceful shutdown requested`,
      "current job will finish before exit",
    ].join(" "),
  );

  shutdownController.abort();
}

process.once(
  "SIGINT",
  () => requestShutdown("SIGINT"),
);

process.once(
  "SIGTERM",
  () => requestShutdown("SIGTERM"),
);

async function main(): Promise<void> {
  const environment =
    getWorkerEnvironment();

  activeWorkerName =
    environment.WORKER_ID;

  console.log(
    `[${activeWorkerName}] started successfully`,
  );

  console.log(
    `[${activeWorkerName}] connecting to Supabase`,
  );

  const supabase =
    createWorkerSupabaseClient(
      environment,
    );

  await pollReviewAnalysisQueue(
    supabase,
    shutdownController.signal,
  );

  console.log(
    `[${activeWorkerName}] shut down safely`,
  );
}

void main().catch(
  (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown worker startup error";

    console.error(
      `[${activeWorkerName}] startup failed: ${message}`,
    );

    process.exitCode = 1;
  },
);