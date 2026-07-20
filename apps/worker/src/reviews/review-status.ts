import type { WorkerSupabaseClient } from "../lib/supabase.js";

export async function ensureReviewStaticAnalysisStatus(
  supabase: WorkerSupabaseClient,
  reviewId: string,
  userId: string,
): Promise<void> {
  const { data: updatedReview, error: updateError } =
    await supabase
      .from("reviews")
      .update({
        status: "static_analysis",
      })
      .eq("id", reviewId)
      .eq("user_id", userId)
      .eq("status", "queued")
      .select("id,status")
      .maybeSingle();

  if (updateError) {
    throw new Error(
      `Unable to start static analysis: ${updateError.message}`,
    );
  }

  if (updatedReview) {
    console.log(
      "[review] status transitioned queued -> static_analysis",
    );

    return;
  }

  /*
   * The conditional update can return no row when:
   * 1. another worker already transitioned the review, or
   * 2. this queue message is being retried.
   *
   * Re-read the status so the operation remains idempotent.
   */
  const { data: existingReview, error: readError } =
    await supabase
      .from("reviews")
      .select("id,status")
      .eq("id", reviewId)
      .eq("user_id", userId)
      .maybeSingle();

  if (readError) {
    throw new Error(
      `Unable to verify review status: ${readError.message}`,
    );
  }

  if (!existingReview) {
    throw new Error(
      "Review was not found while starting static analysis",
    );
  }

  if (existingReview.status === "static_analysis") {
    console.log(
      "[review] status already static_analysis; continuing safely",
    );

    return;
  }

  throw new Error(
    [
      "Review cannot start static analysis.",
      `Current status: ${existingReview.status}.`,
    ].join(" "),
  );
}