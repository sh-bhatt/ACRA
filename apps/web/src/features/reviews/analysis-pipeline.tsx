import {
  AlertCircle,
  Check,
} from "lucide-react";

import type {
  ReviewProcessingStatus,
} from "@/features/reviews/review-analysis-state";
import {
  WorkerCountdown,
} from "@/features/reviews/worker-countdown";

type StageState =
  | "completed"
  | "active"
  | "waiting"
  | "failed";

type PipelineStage = {
  id: "queued" | "static" | "ai" | "report";
  name: string;
  tooling: string;
  state: StageState;
};

type AnalysisPipelineProps = {
  status: ReviewProcessingStatus;
  hasStaticResults?: boolean;
};

function getPipelineStages(
  status: ReviewProcessingStatus,
  hasStaticResults: boolean,
): PipelineStage[] {
  let queuedState: StageState = "waiting";
  let staticState: StageState = "waiting";
  let aiState: StageState = "waiting";
  let reportState: StageState = "waiting";

  switch (status) {
    case "draft":
      break;

    case "queued":
      queuedState = "active";
      break;

    case "static_analysis":
      queuedState = "completed";
      staticState = "active";
      break;

    case "ai_analysis":
      queuedState = "completed";
      staticState = "completed";
      aiState = "active";
      break;

    case "completed":
      queuedState = "completed";
      staticState = "completed";
      aiState = "completed";
      reportState = "completed";
      break;

    case "failed":
      queuedState = "completed";
      if (hasStaticResults) {
        staticState = "completed";
        aiState = "failed";
      } else {
        staticState = "failed";
      }
      break;
  }

  return [
    {
      id: "queued",
      name: "Review queued",
      tooling: "Async analysis worker",
      state: queuedState,
    },
    {
      id: "static",
      name: "Static analysis",
      tooling: "ESLint · Complexity",
      state: staticState,
    },
    {
      id: "ai",
      name: "AI review",
      tooling: "Groq",
      state: aiState,
    },
    {
      id: "report",
      name: "Final report",
      tooling: "Deterministic score",
      state: reportState,
    },
  ];
}

export function AnalysisPipeline({
  status,
  hasStaticResults = false,
}: AnalysisPipelineProps) {
  const stages = getPipelineStages(
    status,
    hasStaticResults,
  );

  const isInProgress =
    status === "queued" ||
    status === "static_analysis" ||
    status === "ai_analysis";

  return (
    <section
      aria-label="Analysis Pipeline"
      className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Analysis Pipeline
            </p>

            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 font-mono text-[10px] text-neutral-400">
              Async Worker
            </span>
          </div>

          <p className="mt-1 text-xs text-neutral-400">
            Deterministic analysis first. AI second.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status === "completed" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1 text-xs font-medium text-emerald-200">
              <Check className="size-3 stroke-[2.5]" />
              Pipeline complete
            </span>
          )}

          {isInProgress && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-3 py-1 text-xs font-medium text-amber-200">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-300" />
              Processing pipeline
            </span>
          )}

          {status === "failed" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-xs font-medium text-red-200">
              <AlertCircle className="size-3" />
              Pipeline failed
            </span>
          )}

          {status === "draft" && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-neutral-400">
              Draft · Not queued
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage, index) => {
          const isCompleted =
            stage.state === "completed";
          const isActive =
            stage.state === "active";
          const isFailed =
            stage.state === "failed";
          const isWaiting =
            stage.state === "waiting";

          return (
            <div
              key={stage.id}
              className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                isCompleted
                  ? "border-emerald-300/20 bg-emerald-300/[0.03]"
                  : isActive
                    ? stage.id === "ai"
                      ? "border-violet-400/40 bg-violet-400/[0.07] ring-1 ring-violet-400/20"
                      : "border-amber-300/40 bg-amber-300/[0.07] ring-1 ring-amber-300/20"
                    : isFailed
                      ? "border-red-400/30 bg-red-400/[0.07] ring-1 ring-red-400/20"
                      : "border-white/5 bg-white/[0.015] opacity-50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-neutral-500">
                    0{index + 1}
                  </span>

                  {isCompleted && (
                    <span className="flex size-5 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/15 text-emerald-300">
                      <Check className="size-3 stroke-[2.5]" />
                    </span>
                  )}

                  {isActive && (
                    <span
                      className={`flex size-5 items-center justify-center rounded-full ${
                        stage.id === "ai"
                          ? "border border-violet-400/40 bg-violet-400/20"
                          : "border border-amber-400/40 bg-amber-400/20"
                      }`}
                    >
                      <span
                        className={`size-1.5 animate-pulse rounded-full ${
                          stage.id === "ai"
                            ? "bg-violet-300"
                            : "bg-amber-300"
                        }`}
                      />
                    </span>
                  )}

                  {isFailed && (
                    <span className="flex size-5 items-center justify-center rounded-full border border-red-400/40 bg-red-400/20 text-red-200">
                      <AlertCircle className="size-3" />
                    </span>
                  )}

                  {isWaiting && (
                    <span className="flex size-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.02]">
                      <span className="size-1 rounded-full bg-neutral-600" />
                    </span>
                  )}
                </div>

                <h4
                  className={`mt-3 text-sm font-medium ${
                    isCompleted || isActive
                      ? "text-white"
                      : isFailed
                        ? "text-red-200"
                        : "text-neutral-400"
                  }`}
                >
                  {stage.name}
                </h4>

                <p
                  className={`mt-1 font-mono text-xs ${
                    isCompleted
                      ? "text-emerald-300/80"
                      : isActive
                        ? stage.id === "ai"
                          ? "text-violet-200/90"
                          : "text-amber-200/90"
                        : isFailed
                          ? "text-red-300/80"
                          : "text-neutral-500"
                  }`}
                >
                  {stage.tooling}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-2 text-[11px]">
                <span className="text-neutral-500">
                  {isCompleted && "Completed"}
                  {isActive && "Running"}
                  {isWaiting && "Waiting"}
                  {isFailed && "Halted"}
                </span>

                <span
                  className={`font-mono ${
                    isCompleted
                      ? "text-emerald-400"
                      : isActive
                        ? stage.id === "ai"
                          ? "text-violet-300"
                          : "text-amber-300"
                        : isFailed
                          ? "text-red-400"
                          : "text-neutral-600"
                  }`}
                >
                  {isCompleted && "✓"}
                  {isActive && "●"}
                  {isWaiting && "○"}
                  {isFailed && "✕"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {isInProgress && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-amber-300" />
            <span className="text-neutral-300">
              {status === "queued" &&
                "Waiting for an async analysis worker to claim the job..."}
              {status === "static_analysis" &&
                "Running deterministic static analysis (ESLint & complexity)..."}
              {status === "ai_analysis" &&
                "Generating AI review insights via Groq..."}
            </span>
          </div>

          {status === "queued" ? (
            <WorkerCountdown status={status} />
          ) : (
            <span className="font-mono text-[11px] text-neutral-500">
              Auto-refreshes every 2s
            </span>
          )}
        </div>
      )}

      {status === "completed" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2 text-emerald-300">
            <Check className="size-3.5 stroke-[2.5]" />
            <span>
              Pipeline complete · Deterministic review score calculated
            </span>
          </div>

          <span className="font-mono text-[11px] text-neutral-500">
            ESLint · Complexity · Groq
          </span>
        </div>
      )}
    </section>
  );
}
