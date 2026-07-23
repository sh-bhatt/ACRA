import type { AIReviewResult } from "@acra/review-schema";

import type { WorkerSupabaseClient } from "../lib/supabase.js";

type PersistAIReviewInput = {
  reviewId: string;
  review: AIReviewResult;
};




console.log(
  "SUPABASE KEY PREFIX:",
  process.env.SUPABASE_SECRET_KEY?.substring(0, 20),
);
console.log(
  "URL:",
  process.env.SUPABASE_URL,
);

export async function persistAIReview(
  supabase: WorkerSupabaseClient,
  input: PersistAIReviewInput,
): Promise<void> {


const { data, error } = await supabase
  .from("reviews")
  .select("id")
  .limit(1);

console.log(data);
console.log(error);




  const { error: reviewError } =
    await supabase
      .from("ai_reviews")
      .upsert({
        review_id: input.reviewId,

        summary: input.review.summary,

        strengths:
          input.review.strengths,

        refactoring_plan:
          input.review
            .refactoringPlan,

        generated_documentation:
          input.review
            .generatedDocumentation,
      });

  if (reviewError) {
  console.log(reviewError);

  throw reviewError;
}

  const { error: deleteError } =
    await supabase
      .from(
        "ai_review_findings",
      )
      .delete()
      .eq(
        "review_id",
        input.reviewId,
      );

  if (deleteError) {
    throw new Error(
      `Unable to clear AI findings: ${deleteError.message}`,
    );
  }

  if (
    input.review.findings.length === 0
  ) {
    return;
  }

  const findings =
    input.review.findings.map(
      (finding) => ({
        review_id:
          input.reviewId,

        title:
          finding.title,

        category:
          finding.category,

        severity:
          finding.severity,

        confidence:
          finding.confidence,

        file_name:
          finding.fileName,

        line_start:
          finding.lineStart,

        line_end:
          finding.lineEnd,

        explanation:
          finding.explanation,

        suggested_fix:
          finding.suggestedFix,

        replacement_code:
          finding.replacementCode,
      }),
    );

  const {
    error: findingsError,
  } = await supabase
    .from(
      "ai_review_findings",
    )
    .insert(findings);

  if (findingsError) {
    throw new Error(
      `Unable to save AI findings: ${findingsError.message}`,
    );
  }
}