import Link from "next/link";
import { redirect } from "next/navigation";

import {
  NewReviewForm,
} from "@/features/reviews/new-review-form";
import {
  loadExistingPastedReview,
} from "@/features/reviews/load-review-workspace";
import { createClient } from "@/lib/supabase/server";

type NewReviewPageProps = {
  searchParams: Promise<{
    reviewId?: string | string[];
  }>;
};

export default async function NewReviewPage({
  searchParams,
}: NewReviewPageProps) {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("default_review_focus")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error(
      "Unable to load review preferences",
    );
  }

  const resolvedSearchParams =
    await searchParams;

  const requestedReviewId =
    typeof resolvedSearchParams.reviewId ===
    "string"
      ? resolvedSearchParams.reviewId
      : undefined;

  const initialReview = requestedReviewId
    ? await loadExistingPastedReview(
        requestedReviewId,
      )
    : null;

  const initialLoadMessage =
    requestedReviewId && !initialReview
      ? "This saved review could not be restored. You can still start a new analysis below."
      : null;

  return (
    <main className="min-h-screen bg-[#090d0c] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-white/10 pb-7">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-500 transition hover:text-white"
          >
            ← Back to dashboard
          </Link>

          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
            Review workspace
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Paste code, analyze, edit, repeat.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-500 sm:text-base">
            Run static analysis without leaving the
            editor. Results stay attached to the exact
            submitted code snapshot.
          </p>
        </header>

        <div className="py-8">
          <NewReviewForm
            initialReviewFocus={
              profile.default_review_focus
            }
            initialReview={initialReview}
            initialLoadMessage={
              initialLoadMessage
            }
          />
        </div>
      </div>
    </main>
  );
}