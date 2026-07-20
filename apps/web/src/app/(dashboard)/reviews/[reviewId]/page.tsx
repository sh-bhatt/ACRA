import Link from "next/link";
import { notFound } from "next/navigation";
import {
  QueueReviewButton,
} from "@/features/reviews/queue-review-button";
import { createClient } from "@/lib/supabase/server";

type ReviewDetailsPageProps = {
  params: Promise<{
    reviewId: string;
  }>;
};

export default async function ReviewDetailsPage({
  params,
}: ReviewDetailsPageProps) {
  const { reviewId } = await params;

  const supabase = await createClient();

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
        primary_language,
        review_focus,
        file_count,
        total_lines,
        created_at
      `,
    )
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError || !review) {
    notFound();
  }

  const {
    data: files,
    error: filesError,
  } = await supabase
    .from("review_files")
    .select(
      `
        id,
        original_name,
        language,
        size_bytes,
        line_count
      `,
    )
    .eq("review_id", review.id)
    .order("created_at", {
      ascending: true,
    });

  if (filesError) {
    console.error(
      "Unable to load review files:",
      filesError.message,
    );
  }

  return (
    <main className="min-h-screen bg-[#090d0c] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-7">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-500 transition hover:text-white"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.16em] text-amber-200">
              {review.status}
            </span>

            <span className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-600">
              {review.primary_language}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {review.name}
          </h1>

          <p className="mt-4 text-sm text-neutral-500">
            Secure draft created successfully.
          </p>
        </header>

        <section className="grid gap-4 py-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-600">
              Files
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {review.file_count}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-600">
              Lines
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {review.total_lines}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-600">
              Focus areas
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {review.review_focus.length}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-medium text-neutral-200">
              Submitted files
            </h2>
          </div>

          <div className="divide-y divide-white/10">
            {(files ?? []).map((file) => (
              <div
                key={file.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-mono text-sm text-neutral-200">
                    {file.original_name}
                  </p>

                  <p className="mt-1 text-xs text-neutral-600">
                    {file.language}
                  </p>
                </div>

                <div className="flex gap-5 font-mono text-xs text-neutral-500">
                  <span>
                    {file.line_count} lines
                  </span>

                  <span>
                    {file.size_bytes.toLocaleString()} bytes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-6">
  <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300">
    Analysis pipeline
  </p>

  {review.status === "draft" ? (
    <>
      <h2 className="mt-3 text-xl font-semibold">
        Ready for static analysis.
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
        Your source file is stored privately. Submitting
        this draft will add a durable analysis job to the
        worker queue.
      </p>

      <QueueReviewButton
        reviewId={review.id}
      />
    </>
  ) : review.status === "queued" ? (
    <>
      <h2 className="mt-3 text-xl font-semibold">
        Review queued successfully.
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
        The analysis worker will claim this review when it
        becomes available.
      </p>
    </>
  ) : (
    <>
      <h2 className="mt-3 text-xl font-semibold">
        Analysis status: {review.status}
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
        This review has moved beyond the draft stage.
      </p>
    </>
  )}
</section>
      </div>
    </main>
  );
}