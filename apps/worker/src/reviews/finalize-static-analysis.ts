import type { Database } from "@acra/database";
import type {
  StaticReviewScoreBreakdown,
} from "@acra/review-schema";

import type {
  WorkerSupabaseClient,
} from "../lib/supabase.js";

type PublicFunctions =
  Database["public"]["Functions"];

type FinalizeStaticAnalysisFunction =
  PublicFunctions["finalize_static_analysis_job"];

type FinalizeStaticAnalysisArgs =
  FinalizeStaticAnalysisFunction["Args"];

type FinalizeStaticAnalysisInput = {
  reviewId: string;
  userId: string;
  messageId: number;
  scoreBreakdown:
    StaticReviewScoreBreakdown;
};

export async function finalizeStaticAnalysisJob(
  supabase: WorkerSupabaseClient,
  input: FinalizeStaticAnalysisInput,
): Promise<void> {
  const rpcArguments:
    FinalizeStaticAnalysisArgs = {
      target_review_id:
        input.reviewId,

      target_user_id:
        input.userId,

      target_message_id:
        input.messageId,

      target_overall_score:
        input.scoreBreakdown.overallScore,

      target_score_breakdown:
        input.scoreBreakdown,
    };

  const { data, error } =
    await supabase.rpc(
      "finalize_static_analysis_job",
      rpcArguments,
    );

  if (error) {
    throw new Error(
      `Unable to finalize static analysis: ${error.message}`,
    );
  }

  if (data !== true) {
    throw new Error(
      "Static-analysis finalization returned an unexpected result",
    );
  }
}