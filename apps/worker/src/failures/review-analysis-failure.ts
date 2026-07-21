import type { Database } from "@acra/database";
import { z } from "zod";

import type { WorkerSupabaseClient } from "../lib/supabase.js";

type PublicFunctions =
  Database["public"]["Functions"];

type RecordFailureFunction =
  PublicFunctions["record_review_analysis_failure"];

type RecordFailureArgs =
  RecordFailureFunction["Args"];

type DeleteJobFunction =
  PublicFunctions["delete_review_analysis_job"];

type DeleteJobArgs =
  DeleteJobFunction["Args"];

const reviewAnalysisFailureResultSchema = z
  .object({
    action: z.enum([
      "retry",
      "failed",
    ]),

    retryCount: z
      .number()
      .int()
      .min(0)
      .max(3),

    status: z.enum([
      "queued",
      "static_analysis",
      "failed",
    ]),
  })
  .strict();

export type ReviewAnalysisFailureResult =
  z.infer<
    typeof reviewAnalysisFailureResultSchema
  >;

export type ReviewAnalysisFailureClassification = {
  safeMessage: string;
  isUnrecoverable: boolean;
};

type RecordReviewAnalysisFailureInput = {
  reviewId: string;
  userId: string;
  messageId: number;
  safeErrorMessage: string;
  isUnrecoverable: boolean;
};

function startsWithAny(
  value: string,
  prefixes: readonly string[],
): boolean {
  return prefixes.some((prefix) =>
    value.startsWith(prefix),
  );
}

export function classifyReviewAnalysisFailure(
  error: unknown,
): ReviewAnalysisFailureClassification {
  const message =
    error instanceof Error
      ? error.message
      : "";

  if (
    startsWithAny(message, [
      "Size mismatch for",
      "SHA-256 mismatch for",
    ])
  ) {
    return {
      safeMessage:
        "A submitted source file failed integrity validation.",
      isUnrecoverable: true,
    };
  }

  if (
    startsWithAny(message, [
      "ESLint does not support language",
    ])
  ) {
    return {
      safeMessage:
        "A submitted file uses a language that is not supported by static analysis.",
      isUnrecoverable: true,
    };
  }

  if (
    startsWithAny(message, [
      "Invalid review file count:",
      "Queued review does not contain any files",
      "Review file-count mismatch.",
    ])
  ) {
    return {
      safeMessage:
        "The queued review contains invalid or inconsistent file metadata.",
      isUnrecoverable: true,
    };
  }

  if (
    startsWithAny(message, [
      "Review is not available for static analysis.",
      "Review cannot start static analysis.",
      "Review was not found while starting static analysis",
    ])
  ) {
    return {
      safeMessage:
        "The review is not in a valid state for static analysis.",
      isUnrecoverable: true,
    };
  }

  if (
    startsWithAny(message, [
      "Finding normalization mismatch for",
      "Duplicate finding fingerprints detected for",
      "Static findings contain duplicate fingerprints.",
      "Review finding persistence mismatch.",
    ])
  ) {
    return {
      safeMessage:
        "Static analysis produced invalid finding data.",
      isUnrecoverable: true,
    };
  }

  if (
    startsWithAny(message, [
      "Unable to download",
    ])
  ) {
    return {
      safeMessage:
        "A submitted source file could not be downloaded.",
      isUnrecoverable: false,
    };
  }

  if (
    startsWithAny(message, [
      "ESLint analysis exceeded",
    ])
  ) {
    return {
      safeMessage:
        "Static analysis timed out before it could finish.",
      isUnrecoverable: false,
    };
  }

  if (
    startsWithAny(message, [
      "Complexity analysis exceeded",
    ])
  ) {
    return {
      safeMessage:
        "Code complexity analysis timed out before it could finish.",
      isUnrecoverable: false,
    };
  }

  if (
    startsWithAny(message, [
      "Unable to persist static findings:",
      "Static finding persistence count mismatch.",
      "Static findings RPC returned an invalid inserted count",
    ])
  ) {
    return {
      safeMessage:
        "Static analysis findings could not be saved.",
      isUnrecoverable: false,
    };
  }

  if (
    startsWithAny(message, [
      "Unable to persist complexity metrics:",
      "Complexity metrics persistence returned an unexpected result",
      "Complexity persistence count mismatch.",
    ])
  ) {
    return {
      safeMessage:
        "Code complexity metrics could not be saved.",
      isUnrecoverable: false,
    };
  }

  if (
    startsWithAny(message, [
      "Unable to finalize static analysis:",
      "Static-analysis finalization returned an unexpected result",
    ])
  ) {
    return {
      safeMessage:
        "Static analysis completed, but finalization failed.",
      isUnrecoverable: false,
    };
  }

  if (
    startsWithAny(message, [
      "Unable to fetch queued review:",
      "Unable to fetch review files:",
      "Unable to start static analysis:",
      "Unable to verify review status:",
    ])
  ) {
    return {
      safeMessage:
        "Review processing data is temporarily unavailable.",
      isUnrecoverable: false,
    };
  }

  return {
    safeMessage:
      "Static analysis failed due to a temporary processing error.",
    isUnrecoverable: false,
  };
}

export async function recordReviewAnalysisFailure(
  supabase: WorkerSupabaseClient,
  input: RecordReviewAnalysisFailureInput,
): Promise<ReviewAnalysisFailureResult> {
  const normalizedSafeMessage =
    input.safeErrorMessage
      .trim()
      .slice(0, 2_000) ||
    "Static analysis failed unexpectedly.";

  const rpcArguments: RecordFailureArgs = {
    target_review_id: input.reviewId,
    target_user_id: input.userId,
    target_message_id: input.messageId,
    safe_error_message:
      normalizedSafeMessage,
    is_unrecoverable:
      input.isUnrecoverable,
  };

  const { data, error } = await supabase.rpc(
    "record_review_analysis_failure",
    rpcArguments,
  );

  if (error) {
    throw new Error(
      `Unable to record review-analysis failure: ${error.message}`,
    );
  }

  const parsedResult =
    reviewAnalysisFailureResultSchema.safeParse(
      data,
    );

  if (!parsedResult.success) {
    throw new Error(
      "Review-analysis failure RPC returned an invalid result",
    );
  }

  return parsedResult.data;
}

export async function deleteInvalidReviewAnalysisJob(
  supabase: WorkerSupabaseClient,
  messageId: number,
): Promise<void> {
  const rpcArguments: DeleteJobArgs = {
    target_message_id: messageId,
  };

  const { data, error } = await supabase.rpc(
    "delete_review_analysis_job",
    rpcArguments,
  );

  if (error) {
    throw new Error(
      `Unable to delete invalid queue message: ${error.message}`,
    );
  }

  if (data !== true) {
    throw new Error(
      "Invalid queue-message deletion returned an unexpected result",
    );
  }
}