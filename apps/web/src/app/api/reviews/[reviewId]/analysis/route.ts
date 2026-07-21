import {
  staticReviewScoreBreakdownSchema,
} from "@acra/review-schema";

import {
  type ReviewAnalysisSnapshotResult,
  type ReviewProcessingStatus,
} from "@/features/reviews/review-analysis-state";
import { createClient } from "@/lib/supabase/server";

type ReviewAnalysisRouteContext = {
  params: Promise<{
    reviewId: string;
  }>;
};

export const dynamic = "force-dynamic";

function jsonResponse(
  body: ReviewAnalysisSnapshotResult,
  status = 200,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  });
}

export async function GET(
  _request: Request,
  context: ReviewAnalysisRouteContext,
): Promise<Response> {
  const { reviewId } = await context.params;

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return jsonResponse(
      {
        ok: false,
        message:
          "Your session has expired. Please sign in again.",
      },
      401,
    );
  }

  const {
    data: review,
    error: reviewError,
  } = await supabase
    .from("reviews")
    .select(
      `
        id,
        name,
        status,
        retry_count,
        error_message,
        overall_score,
        score_breakdown
      `,
    )
    .eq("id", reviewId)
    .eq("user_id", userId)
    .maybeSingle();

  if (reviewError) {
    console.error(
      "Unable to load review analysis:",
      reviewError.message,
    );

    return jsonResponse(
      {
        ok: false,
        message:
          "The requested review could not be loaded.",
      },
      500,
    );
  }

  if (!review) {
    return jsonResponse(
      {
        ok: false,
        message:
          "The requested review could not be found.",
      },
      404,
    );
  }

  const [
    filesResult,
    findingsResult,
    complexityResult,
  ] = await Promise.all([
    supabase
      .from("review_files")
      .select("id,original_name")
      .eq("review_id", review.id)
      .eq("user_id", userId),

    supabase
      .from("findings")
      .select(
        `
          id,
          file_id,
          source,
          rule_id,
          category,
          severity,
          title,
          explanation,
          suggested_fix,
          replacement_code,
          line_start,
          line_end,
          created_at
        `,
      )
      .eq("review_id", review.id)
      .eq("user_id", userId)
      .order("created_at", {
        ascending: true,
      }),

    supabase
      .from("complexity_metrics")
      .select(
        `
          id,
          file_id,
          lines_of_code,
          blank_lines,
          comment_lines,
          function_count,
          class_count,
          import_count,
          cyclomatic_complexity,
          maximum_nesting_depth,
          average_function_length,
          maximum_function_length,
          maintainability_score,
          created_at
        `,
      )
      .eq("review_id", review.id)
      .eq("user_id", userId)
      .order("created_at", {
        ascending: true,
      }),
  ]);

  if (
    filesResult.error ||
    findingsResult.error ||
    complexityResult.error
  ) {
    console.error(
      "Unable to load review analysis data:",
      filesResult.error?.message ??
        findingsResult.error?.message ??
        complexityResult.error?.message,
    );

    return jsonResponse(
      {
        ok: false,
        message:
          "The latest analysis data could not be loaded.",
      },
      500,
    );
  }

  const fileNames = new Map(
    (filesResult.data ?? []).map((file) => [
      file.id,
      file.original_name,
    ]),
  );

  const parsedScoreBreakdown =
    review.score_breakdown === null
      ? null
      : staticReviewScoreBreakdownSchema.safeParse(
          review.score_breakdown,
        );

  if (
    parsedScoreBreakdown !== null &&
    !parsedScoreBreakdown.success
  ) {
    console.error(
      "Stored score breakdown is invalid:",
      parsedScoreBreakdown.error.message,
    );
  }

  return jsonResponse({
    ok: true,
    data: {
      review: {
        id: review.id,
        name: review.name,
        status:
          review.status as ReviewProcessingStatus,
        retryCount: review.retry_count,
        errorMessage: review.error_message,
        overallScore: review.overall_score,
        scoreBreakdown:
          parsedScoreBreakdown?.success
            ? parsedScoreBreakdown.data
            : null,
      },

      findings: (
        findingsResult.data ?? []
      ).map((finding) => ({
        id: finding.id,
        fileId: finding.file_id,
        fileName:
          fileNames.get(finding.file_id) ??
          "Unknown file",
        source: finding.source,
        ruleId: finding.rule_id,
        category: finding.category,
        severity: finding.severity,
        title: finding.title,
        explanation: finding.explanation,
        suggestedFix:
          finding.suggested_fix,
        replacementCode:
          finding.replacement_code,
        lineStart: finding.line_start,
        lineEnd: finding.line_end,
      })),

      complexityMetrics: (
        complexityResult.data ?? []
      ).map((metrics) => ({
        id: metrics.id,
        fileId: metrics.file_id,
        fileName:
          fileNames.get(metrics.file_id) ??
          "Unknown file",
        linesOfCode:
          metrics.lines_of_code,
        blankLines:
          metrics.blank_lines,
        commentLines:
          metrics.comment_lines,
        functionCount:
          metrics.function_count,
        classCount:
          metrics.class_count,
        importCount:
          metrics.import_count,
        cyclomaticComplexity:
          metrics.cyclomatic_complexity,
        maximumNestingDepth:
          metrics.maximum_nesting_depth,
        averageFunctionLength:
          metrics.average_function_length,
        maximumFunctionLength:
          metrics.maximum_function_length,
        maintainabilityScore:
          metrics.maintainability_score,
      })),
    },
  });
}