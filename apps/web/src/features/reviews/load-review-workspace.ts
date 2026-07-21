import { z } from "zod";

import {
  REVIEW_FOCUS_VALUES,
} from "@/features/profile/profile-options";
import type {
  ExistingPastedReview,
} from "@/features/reviews/review-workspace-state";
import {
  PASTE_LANGUAGE_VALUES,
} from "@/features/reviews/review-options";
import { createClient } from "@/lib/supabase/server";

const reviewIdSchema = z.string().uuid();

const existingReviewSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  input_type: z.literal("paste"),
  primary_language: z.enum(
    PASTE_LANGUAGE_VALUES,
  ),
  review_focus: z
    .array(z.enum(REVIEW_FOCUS_VALUES))
    .min(1),
});

export async function loadExistingPastedReview(
  reviewId: string,
): Promise<ExistingPastedReview | null> {
  const parsedReviewId =
    reviewIdSchema.safeParse(reviewId);

  if (!parsedReviewId.success) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return null;
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
        input_type,
        primary_language,
        review_focus
      `,
    )
    .eq("id", parsedReviewId.data)
    .eq("user_id", userId)
    .eq("input_type", "paste")
    .maybeSingle();

  if (reviewError || !review) {
    if (reviewError) {
      console.error(
        "Unable to restore review workspace:",
        reviewError.message,
      );
    }

    return null;
  }

  const parsedReview =
    existingReviewSchema.safeParse(review);

  if (!parsedReview.success) {
    console.error(
      "Stored review workspace metadata is invalid:",
      parsedReview.error.message,
    );

    return null;
  }

  const {
    data: file,
    error: fileError,
  } = await supabase
    .from("review_files")
    .select(
      `
        id,
        storage_path,
        created_at
      `,
    )
    .eq("review_id", parsedReview.data.id)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (fileError || !file) {
    if (fileError) {
      console.error(
        "Unable to restore review source metadata:",
        fileError.message,
      );
    }

    return null;
  }

  const {
    data: sourceFile,
    error: downloadError,
  } = await supabase.storage
    .from("review-source-files")
    .download(file.storage_path);

  if (downloadError || !sourceFile) {
    if (downloadError) {
      console.error(
        "Unable to restore review source:",
        downloadError.message,
      );
    }

    return null;
  }

  const code = await sourceFile.text();

  return {
    id: parsedReview.data.id,
    name: parsedReview.data.name,
    language:
      parsedReview.data.primary_language,
    reviewFocus:
      parsedReview.data.review_focus,
    code,
  };
}