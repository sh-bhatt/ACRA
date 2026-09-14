"use client";

import {
  useEffect,
  useState,
} from "react";
import { Clock } from "lucide-react";

import type {
  ReviewProcessingStatus,
} from "@/features/reviews/review-analysis-state";

export function calculateNextWorkerRun(
  now: Date = new Date(),
): {
  formatted: string;
  totalSeconds: number;
} {
  const next = new Date(now.getTime());
  const minutes = next.getMinutes();
  const seconds = next.getSeconds();
  const ms = next.getMilliseconds();

  const remainderMinutes = minutes % 5;
  const minutesToAdd =
    remainderMinutes === 0 && seconds === 0 && ms === 0
      ? 5
      : 5 - remainderMinutes;

  next.setMinutes(minutes + minutesToAdd, 0, 0);

  const diffMs = Math.max(
    0,
    next.getTime() - now.getTime(),
  );
  const totalSeconds = Math.floor(diffMs / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  const formatted = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return { formatted, totalSeconds };
}

type WorkerCountdownProps = {
  status?: ReviewProcessingStatus;
};

export function WorkerCountdown({
  status = "queued",
}: WorkerCountdownProps) {
  const [formattedTime, setFormattedTime] =
    useState<string>(() => {
      return calculateNextWorkerRun().formatted;
    });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFormattedTime(
        calculateNextWorkerRun().formatted,
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  if (status !== "queued") {
    return null;
  }

  return (
    <div
      suppressHydrationWarning
      className="flex items-center gap-1.5 font-mono text-xs text-neutral-400"
    >
      <Clock className="size-3 text-neutral-500" />

      <span>
        Next worker run in{" "}
        <span className="text-neutral-200">
          {formattedTime}
        </span>
      </span>
    </div>
  );
}
