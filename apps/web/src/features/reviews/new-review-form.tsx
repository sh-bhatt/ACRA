"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  REVIEW_FOCUS_OPTIONS,
  REVIEW_FOCUS_VALUES,
  type ReviewFocusValue,
} from "@/features/profile/profile-options";
import {
  createPastedReviewAction,
} from "@/features/reviews/actions";
import {
  CodeEditor,
} from "@/features/reviews/code-editor";
import {
  initialNewReviewActionState,
} from "@/features/reviews/new-review-state";
import {
  ReviewAnalysisPanel,
} from "@/features/reviews/review-analysis-panel";
import {
  PASTE_LANGUAGE_OPTIONS,
  type PasteLanguage,
} from "@/features/reviews/review-options";
import type {
  ExistingPastedReview,
} from "@/features/reviews/review-workspace-state";

type NewReviewFormProps = {
  initialReviewFocus: string[];
  initialReview: ExistingPastedReview | null;
  initialLoadMessage: string | null;
};

function isReviewFocusValue(
  value: string,
): value is ReviewFocusValue {
  return (
    REVIEW_FOCUS_VALUES as readonly string[]
  ).includes(value);
}

export function NewReviewForm({
  initialReviewFocus,
  initialReview,
  initialLoadMessage,
}: NewReviewFormProps) {
  const normalizedInitialFocus =
    useMemo<ReviewFocusValue[]>(() => {
      if (
        initialReview &&
        initialReview.reviewFocus.length > 0
      ) {
        return initialReview.reviewFocus;
      }

      const validFocus =
        initialReviewFocus.filter(
          isReviewFocusValue,
        );

      return validFocus.length > 0
        ? validFocus
        : ["full"];
    }, [
      initialReview,
      initialReviewFocus,
    ]);

  const [
    selectedFocus,
    setSelectedFocus,
  ] = useState<ReviewFocusValue[]>(
    normalizedInitialFocus,
  );

  const [name, setName] = useState(
    initialReview?.name ?? "",
  );

  const [language, setLanguage] =
    useState<PasteLanguage>(
      initialReview?.language ??
        "typescript",
    );

  const [code, setCode] = useState(
    initialReview?.code ?? "",
  );

  const submittedCodeRef =
    useRef<string>(
      initialReview?.code ?? "",
    );

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    createPastedReviewAction,
    initialNewReviewActionState,
  );

  useEffect(() => {
    if (
      state.status !== "success" ||
      !state.reviewId
    ) {
      return;
    }

    const currentUrl =
      new URL(window.location.href);

    currentUrl.searchParams.set(
      "reviewId",
      state.reviewId,
    );

    window.history.replaceState(
      null,
      "",
      `${currentUrl.pathname}${currentUrl.search}`,
    );
  }, [
    state.reviewId,
    state.status,
  ]);

  const lineCount =
    code.length === 0
      ? 0
      : code.split(/\r\n|\r|\n/).length;

  const sizeBytes =
    new TextEncoder().encode(code).length;

  const isTooLarge =
    sizeBytes > 200_000;

  const activeReviewId =
    state.reviewId ??
    initialReview?.id ??
    null;

  const isAnalysisStale =
    Boolean(activeReviewId) &&
    code !== submittedCodeRef.current;

  function updateFocus(
    value: ReviewFocusValue,
    checked: boolean,
  ): void {
    setSelectedFocus((current) => {
      if (value === "full" && checked) {
        return ["full"];
      }

      const withoutFull = current.filter(
        (focus) => focus !== "full",
      );

      if (checked) {
        return Array.from(
          new Set([
            ...withoutFull,
            value,
          ]),
        );
      }

      const next = withoutFull.filter(
        (focus) => focus !== value,
      );

      return next.length > 0
        ? next
        : current;
    });
  }

  const statusMessageClassName =
    state.status === "error"
      ? "border-red-400/20 bg-red-400/10 text-red-200"
      : state.queued
        ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100"
        : "border-amber-300/20 bg-amber-300/[0.08] text-amber-100";

  return (
    <div className="space-y-8">
      <form
        action={formAction}
        onSubmit={() => {
          submittedCodeRef.current = code;
        }}
        className="space-y-8"
      >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-sm font-medium text-neutral-200"
          >
            Review name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            maxLength={100}
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            placeholder="Authentication helper review"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="primaryLanguage"
            className="text-sm font-medium text-neutral-200"
          >
            Language
          </label>

          <select
            id="primaryLanguage"
            name="primaryLanguage"
            value={language}
            onChange={(event) => {
              setLanguage(
                event.target.value as PasteLanguage,
              );
            }}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#0d1210] px-4 text-sm text-white outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
          >
            {PASTE_LANGUAGE_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      <fieldset className="space-y-4">
        <div>
          <legend className="text-sm font-medium text-neutral-200">
            Review focus
          </legend>

          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Full review covers every category. Selecting
            a specific category disables Full review.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEW_FOCUS_OPTIONS.map(
            (option) => {
              const checked =
                selectedFocus.includes(
                  option.value,
                );

              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    checked
                      ? "border-emerald-300/35 bg-emerald-300/[0.07]"
                      : "border-white/10 bg-white/[0.025] hover:border-white/20"
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      name="reviewFocus"
                      value={option.value}
                      checked={checked}
                      onChange={(event) => {
                        updateFocus(
                          option.value,
                          event.target.checked,
                        );
                      }}
                      className="mt-1 size-4 accent-emerald-300"
                    />

                    <span>
                      <span className="block text-sm font-medium text-neutral-200">
                        {option.label}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-neutral-500">
                        {option.description}
                      </span>
                    </span>
                  </div>
                </label>
              );
            },
          )}
        </div>
      </fieldset>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-neutral-200">
              Source code
            </h2>

            <p className="mt-1 text-xs text-neutral-500">
              Your code is stored privately and is not
              executed during this step.
            </p>
          </div>

          <div className="flex gap-4 font-mono text-xs text-neutral-500">
            <span>{lineCount} lines</span>

            <span>
              {sizeBytes.toLocaleString()} / 200,000 bytes
            </span>
          </div>
        </div>

        <CodeEditor
          value={code}
          language={language}
          onChange={setCode}
        />

        <textarea
          name="code"
          value={code}
          readOnly
          hidden
        />

        {isTooLarge ? (
          <p className="text-sm text-red-300">
            Code exceeds the 200 KB limit.
          </p>
        ) : null}
      </section>

      {initialLoadMessage ? (
        <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-100">
          {initialLoadMessage}
        </p>
      ) : null}

      {state.message ? (
        <p
          role={
            state.status === "error"
              ? "alert"
              : "status"
          }
          className={`rounded-xl border px-4 py-3 text-sm ${statusMessageClassName}`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
        <p className="max-w-xl text-xs leading-5 text-neutral-500">
          Only source-code text is stored. ACRA will not
          install dependencies or execute submitted code.
        </p>

        <button
          type="submit"
          disabled={
            isPending ||
            code.trim().length === 0 ||
            isTooLarge
          }
          className="inline-flex h-12 items-center rounded-xl bg-emerald-300 px-6 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Creating and queuing review..."
            : activeReviewId
              ? "Run analysis again"
              : "Run static analysis"}
        </button>
      </div>
      </form>

      {activeReviewId ? (
        <ReviewAnalysisPanel
          key={activeReviewId}
          reviewId={activeReviewId}
          isStale={isAnalysisStale}
        />
      ) : null}
    </div>
  );
}