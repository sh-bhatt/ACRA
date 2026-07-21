import type { Database } from "@acra/database";
import type { ComplexityMetrics } from "@acra/review-schema";

import type { WorkerSupabaseClient } from "../lib/supabase.js";

type PublicFunctions =
  Database["public"]["Functions"];

type UpsertComplexityFunction =
  PublicFunctions["upsert_complexity_metrics_for_file"];

type UpsertComplexityArgs =
  UpsertComplexityFunction["Args"];

type PersistComplexityMetricsInput = {
  reviewId: string;
  fileId: string;
  userId: string;
  metrics: ComplexityMetrics;
};

function createPersistenceArguments(
  input: PersistComplexityMetricsInput,
): UpsertComplexityArgs {
  const targetMetrics: UpsertComplexityArgs["target_metrics"] = {
    linesOfCode:
      input.metrics.linesOfCode,

    blankLines:
      input.metrics.blankLines,

    commentLines:
      input.metrics.commentLines,

    functionCount:
      input.metrics.functionCount,

    classCount:
      input.metrics.classCount,

    importCount:
      input.metrics.importCount,

    cyclomaticComplexity:
      input.metrics.cyclomaticComplexity,

    maximumNestingDepth:
      input.metrics.maximumNestingDepth,

    averageFunctionLength:
      input.metrics.averageFunctionLength,

    maximumFunctionLength:
      input.metrics.maximumFunctionLength,

    maintainabilityScore:
      input.metrics.maintainabilityScore,
  };

  return {
    target_review_id: input.reviewId,
    target_file_id: input.fileId,
    target_user_id: input.userId,
    target_metrics: targetMetrics,
  };
}

export async function persistComplexityMetricsForFile(
  supabase: WorkerSupabaseClient,
  input: PersistComplexityMetricsInput,
): Promise<void> {
  const rpcArguments =
    createPersistenceArguments(input);

  const { data, error } = await supabase.rpc(
    "upsert_complexity_metrics_for_file",
    rpcArguments,
  );

  if (error) {
    throw new Error(
      `Unable to persist complexity metrics: ${error.message}`,
    );
  }

  if (data !== true) {
    throw new Error(
      "Complexity metrics persistence returned an unexpected result",
    );
  }
}