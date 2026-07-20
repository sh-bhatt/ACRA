import Link from "next/link";
import { redirect } from "next/navigation";

import {
  NewReviewForm,
} from "@/features/reviews/new-review-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewReviewPage() {
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

          <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
            New review
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Paste code for analysis.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-500">
            Start with one JavaScript or TypeScript file.
            Static analysis and AI review will be connected
            in the next stages.
          </p>
        </header>

        <section className="py-10">
          <NewReviewForm
            initialReviewFocus={
              profile.default_review_focus
            }
          />
        </section>
      </div>
    </main>
  );
}