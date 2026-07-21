import type { WorkerSupabaseClient } from "../lib/supabase.js";
import { claimAndRunStaticAnalysisJob } from "./review-analysis-job.js";

const QUEUE_POLL_INTERVAL_MS = 5_000;
const POLLING_ERROR_BACKOFF_MS = 10_000;

function waitForDelay(
  milliseconds: number,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const finishWaiting = (): void => {
      clearTimeout(timeout);
      signal.removeEventListener(
        "abort",
        handleAbort,
      );

      resolve();
    };

    const handleAbort = (): void => {
      finishWaiting();
    };

    const timeout = setTimeout(
      finishWaiting,
      milliseconds,
    );

    signal.addEventListener(
      "abort",
      handleAbort,
      {
        once: true,
      },
    );
  });
}

function getSafeErrorMessage(
  error: unknown,
): string {
  if (!(error instanceof Error)) {
    return "Unknown queue polling error";
  }

  return error.message
    .trim()
    .slice(0, 500);
}

export async function pollReviewAnalysisQueue(
  supabase: WorkerSupabaseClient,
  signal: AbortSignal,
): Promise<void> {
  console.log(
    [
      "[poller] review-analysis queue polling started",
      `interval_ms=${QUEUE_POLL_INTERVAL_MS}`,
    ].join(" "),
  );

  while (!signal.aborted) {
    try {
      await claimAndRunStaticAnalysisJob(
        supabase,
      );
    } catch (error: unknown) {
      console.error(
        [
          "[poller] queue iteration failed",
          `reason="${getSafeErrorMessage(error)}"`,
          `retrying_in_ms=${POLLING_ERROR_BACKOFF_MS}`,
        ].join(" "),
      );

      if (signal.aborted) {
        break;
      }

      await waitForDelay(
        POLLING_ERROR_BACKOFF_MS,
        signal,
      );

      continue;
    }

    if (signal.aborted) {
      break;
    }

    await waitForDelay(
      QUEUE_POLL_INTERVAL_MS,
      signal,
    );
  }

  console.log(
    "[poller] review-analysis queue polling stopped",
  );
}