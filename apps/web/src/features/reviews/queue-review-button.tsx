"use client";

import { useActionState } from "react";

import {
  queueReviewAction,
} from "@/features/reviews/actions";
import {
  initialQueueReviewActionState,
} from "@/features/reviews/queue-review-state";

type QueueReviewButtonProps = {
  reviewId: string;
};

export function QueueReviewButton({
  reviewId,
}: QueueReviewButtonProps) {
  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    queueReviewAction,
    initialQueueReviewActionState,
  );

  return (
    <form action={formAction} className="mt-6">
      <input
        type="hidden"
        name="reviewId"
        value={reviewId}
      />

      {state.message ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center rounded-xl bg-emerald-300 px-6 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? "Adding to analysis queue..."
          : "Start static analysis"}
      </button>
    </form>
  );
}