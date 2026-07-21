"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReviewAnalysisSnapshotResult,
} from "@/features/reviews/review-analysis-state";

type ReviewAnalysisPanelProps = {
  reviewId: string;
  isStale: boolean;
};

const TERMINAL_STATUSES = new Set([
  "draft",
  "completed",
  "failed",
]);

const POLL_INTERVAL_MS = 2_000;

function formatStatus(
  status: string,
): string {
  return status
    .split("_")
    .map((part) => {
      return (
        part.charAt(0).toUpperCase() +
        part.slice(1)
      );
    })
    .join(" ");
}

function getSeverityClasses(
  severity: string,
): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "border-red-400/25 bg-red-400/10 text-red-200";
    case "high":
      return "border-orange-400/25 bg-orange-400/10 text-orange-200";
    case "medium":
      return "border-amber-300/25 bg-amber-300/10 text-amber-100";
    default:
      return "border-sky-300/20 bg-sky-300/[0.08] text-sky-100";
  }
}

function getScoreLabel(
  score: number | null,
): string {
  if (score === null) {
    return "Not scored";
  }

  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 75) {
    return "Good";
  }

  if (score >= 60) {
    return "Needs work";
  }

  return "High risk";
}

function getScoreClasses(
  score: number | null,
): string {
  if (score === null) {
    return "border-white/10 bg-white/[0.025] text-neutral-300";
  }

  if (score >= 90) {
    return "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100";
  }

  if (score >= 75) {
    return "border-sky-300/20 bg-sky-300/[0.07] text-sky-100";
  }

  if (score >= 60) {
    return "border-amber-300/25 bg-amber-300/[0.08] text-amber-100";
  }

  return "border-red-400/25 bg-red-400/[0.08] text-red-100";
}

export function ReviewAnalysisPanel({
  reviewId,
  isStale,
}: ReviewAnalysisPanelProps) {
  const [
    result,
    setResult,
  ] = useState<
    ReviewAnalysisSnapshotResult | null
  >(null);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeout:
      | ReturnType<typeof setTimeout>
      | undefined;

    async function refresh(): Promise<void> {
      setIsRefreshing(true);

      try {
        const response = await fetch(
          `/api/reviews/${encodeURIComponent(
            reviewId,
          )}/analysis`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const next =
          (await response.json()) as ReviewAnalysisSnapshotResult;

        if (cancelled) {
          return;
        }

        setResult(next);
        setIsRefreshing(false);

        if (
          next.ok &&
          !TERMINAL_STATUSES.has(
            next.data.review.status,
          )
        ) {
          timeout = setTimeout(
            () => {
              void refresh();
            },
            POLL_INTERVAL_MS,
          );
        }
      } catch {
        if (cancelled) {
          return;
        }

        setResult({
          ok: false,
          message:
            "Unable to refresh the analysis right now.",
        });

        setIsRefreshing(false);

        timeout = setTimeout(
          () => {
            void refresh();
          },
          POLL_INTERVAL_MS,
        );
      }
    }

    void refresh();

    return () => {
      cancelled = true;

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [reviewId]);

  const summary = useMemo(() => {
    if (!result?.ok) {
      return null;
    }

    const metrics =
      result.data.complexityMetrics;

    return {
      findings:
        result.data.findings.length,

      linesOfCode: metrics.reduce(
        (total, item) =>
          total + item.linesOfCode,
        0,
      ),

      maximumComplexity:
        metrics.reduce(
          (maximum, item) =>
            Math.max(
              maximum,
              item.cyclomaticComplexity,
            ),
          0,
        ),

      maintainability:
        metrics.length === 0
          ? 0
          : Math.round(
              (
                metrics.reduce(
                  (total, item) =>
                    total +
                    item.maintainabilityScore,
                  0,
                ) / metrics.length
              ) * 100,
            ) / 100,

      overallScore:
        result.data.review.overallScore,
    };
  }, [result]);

  if (!result) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex items-center gap-3">
          <span className="size-2.5 animate-pulse rounded-full bg-emerald-300" />

          <p className="text-sm text-neutral-300">
            Loading the analysis workspace...
          </p>
        </div>
      </section>
    );
  }

  if (!result.ok) {
    return (
      <section className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-6">
        <h2 className="font-semibold text-red-100">
          Analysis could not be loaded
        </h2>

        <p className="mt-2 text-sm text-red-200/80">
          {result.message}
        </p>
      </section>
    );
  }

  const snapshot = result.data;
  const isDraft =
    snapshot.review.status === "draft";
  const isCompleted =
    snapshot.review.status === "completed";
  const isFailed =
    snapshot.review.status === "failed";

  const scoreBreakdown =
    snapshot.review.scoreBreakdown;

  const scoreLabel = getScoreLabel(
    snapshot.review.overallScore,
  );

  return (
    <section
      aria-live="polite"
      className="space-y-6 border-t border-white/10 pt-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Analysis workspace
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            {snapshot.review.name}
          </h2>

          <p className="mt-1 font-mono text-xs text-neutral-600">
            {snapshot.review.id}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          {isRefreshing &&
          !isCompleted &&
          !isFailed ? (
            <span className="size-2 animate-pulse rounded-full bg-emerald-300" />
          ) : null}

          <span className="text-xs font-medium text-neutral-300">
            {formatStatus(
              snapshot.review.status,
            )}
          </span>
        </div>
      </div>

      {isStale ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-100">
          Code has changed since this analysis.
          Run static analysis again to refresh the results.
        </div>
      ) : null}

      {isDraft ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-6">
          <h3 className="font-semibold text-amber-100">
            Analysis is not queued
          </h3>

          <p className="mt-2 text-sm leading-6 text-amber-100/75">
            This code snapshot was saved, but no worker
            job is currently running. Submit the editor
            again to create and queue a fresh snapshot.
          </p>
        </div>
      ) : null}

      {!isDraft && !isCompleted && !isFailed ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center gap-3">
            <span className="size-2.5 animate-pulse rounded-full bg-emerald-300" />

            <div>
              <p className="text-sm font-medium text-neutral-200">
                {snapshot.review.status ===
                "queued"
                  ? "Waiting for an analysis worker"
                  : "Static analysis is running"}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Results refresh automatically every two
                seconds.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isFailed ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-6">
          <h3 className="font-semibold text-red-100">
            Analysis failed
          </h3>

          <p className="mt-2 text-sm leading-6 text-red-200/80">
            {snapshot.review.errorMessage ??
              "The worker could not complete this review."}
          </p>

          <p className="mt-3 font-mono text-xs text-red-200/60">
            Retry count:{" "}
            {snapshot.review.retryCount}
          </p>
        </div>
      ) : null}

      {isCompleted && summary ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <article
              className={`rounded-2xl border p-6 ${getScoreClasses(
                summary.overallScore,
              )}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                Code health score
              </p>

              <div className="mt-5 flex items-end gap-3">
                <span className="font-mono text-6xl font-semibold leading-none">
                  {summary.overallScore ?? "—"}
                </span>

                <span className="pb-1 font-mono text-sm opacity-60">
                  /100
                </span>
              </div>

              <p className="mt-4 text-sm font-medium">
                {scoreLabel}
              </p>

              <p className="mt-2 max-w-md text-xs leading-5 opacity-65">
                This score is deterministic. The same
                findings and complexity metrics produce
                the same result every time.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Score breakdown
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  Where the points went
                </h3>
              </div>

              {scoreBreakdown ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                      <p className="text-xs text-neutral-500">
                        Base
                      </p>

                      <p className="mt-2 font-mono text-xl text-white">
                        {scoreBreakdown.baseScore}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                      <p className="text-xs text-neutral-500">
                        Severity deductions
                      </p>

                      <p className="mt-2 font-mono text-xl text-red-200">
                        -
                        {scoreBreakdown.severity.totalDeduction}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                      <p className="text-xs text-neutral-500">
                        Structural deductions
                      </p>

                      <p className="mt-2 font-mono text-xl text-amber-100">
                        -
                        {scoreBreakdown.structural.totalDeduction}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      [
                        "Critical",
                        scoreBreakdown.severity
                          .criticalCount,
                      ],
                      [
                        "High",
                        scoreBreakdown.severity
                          .highCount,
                      ],
                      [
                        "Medium",
                        scoreBreakdown.severity
                          .mediumCount,
                      ],
                      [
                        "Low",
                        scoreBreakdown.severity
                          .lowCount,
                      ],
                      [
                        "Info",
                        scoreBreakdown.severity
                          .infoCount,
                      ],
                    ].map(([label, count]) => (
                      <span
                        key={label}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-neutral-400"
                      >
                        {label}:{" "}
                        <span className="font-mono text-neutral-200">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>

                  <p className="mt-5 border-t border-white/10 pt-4 text-sm text-neutral-400">
                    Applied deduction:{" "}
                    <span className="font-mono text-neutral-200">
                      {scoreBreakdown.appliedDeduction}
                    </span>
                    {" · "}
                    Final score:{" "}
                    <span className="font-mono text-emerald-200">
                      {scoreBreakdown.overallScore}
                    </span>
                  </p>
                </>
              ) : (
                <p className="mt-5 text-sm leading-6 text-neutral-500">
                  This review was completed before score
                  breakdown persistence was enabled.
                </p>
              )}
            </article>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Findings",
                summary.findings,
              ],
              [
                "Lines of code",
                summary.linesOfCode,
              ],
              [
                "Max complexity",
                summary.maximumComplexity,
              ],
              [
                "Maintainability",
                `${summary.maintainability}/100`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                  {label}
                </p>

                <p className="mt-3 font-mono text-2xl text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <section className="space-y-3">
            <div>
              <h3 className="font-semibold text-white">
                Complexity metrics
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                Structural signals calculated without
                executing submitted code.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {snapshot.complexityMetrics.map(
                (metrics) => (
                  <article
                    key={metrics.id}
                    className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-mono text-sm text-neutral-200">
                        {metrics.fileName}
                      </h4>

                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1 font-mono text-xs text-emerald-100">
                        {metrics.maintainabilityScore}/100
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-neutral-500">
                          LOC
                        </dt>
                        <dd className="mt-1 font-mono text-neutral-200">
                          {metrics.linesOfCode}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-neutral-500">
                          Complexity
                        </dt>
                        <dd className="mt-1 font-mono text-neutral-200">
                          {metrics.cyclomaticComplexity}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-neutral-500">
                          Nesting
                        </dt>
                        <dd className="mt-1 font-mono text-neutral-200">
                          {metrics.maximumNestingDepth}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-neutral-500">
                          Functions
                        </dt>
                        <dd className="mt-1 font-mono text-neutral-200">
                          {metrics.functionCount}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-neutral-500">
                          Avg. function
                        </dt>
                        <dd className="mt-1 font-mono text-neutral-200">
                          {metrics.averageFunctionLength}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-neutral-500">
                          Max function
                        </dt>
                        <dd className="mt-1 font-mono text-neutral-200">
                          {metrics.maximumFunctionLength}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ),
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="font-semibold text-white">
                Static findings
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                Review issues with file and line context.
              </p>
            </div>

            {snapshot.findings.length === 0 ? (
              <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5 text-sm text-emerald-100">
                No static findings were detected.
              </div>
            ) : (
              <div className="space-y-3">
                {snapshot.findings.map(
                  (finding) => (
                    <article
                      key={finding.id}
                      className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getSeverityClasses(
                                finding.severity,
                              )}`}
                            >
                              {finding.severity}
                            </span>

                            <span className="font-mono text-xs text-neutral-500">
                              {finding.fileName}
                              {finding.lineStart
                                ? `:${finding.lineStart}`
                                : ""}
                            </span>
                          </div>

                          <h4 className="mt-3 font-medium text-neutral-100">
                            {finding.title}
                          </h4>
                        </div>

                        <span className="font-mono text-xs text-neutral-600">
                          {finding.ruleId ??
                            finding.source}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-neutral-400">
                        {finding.explanation}
                      </p>

                      {finding.suggestedFix ? (
                        <div className="mt-4 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.045] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                            Suggested fix
                          </p>

                          <p className="mt-2 text-sm leading-6 text-neutral-300">
                            {finding.suggestedFix}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}