import Groq from "groq-sdk";

import type {
  WorkerEnvironment,
} from "../config/env.js";

export type WorkerGroqClient = Groq;

export function createWorkerGroqClient(
  environment: WorkerEnvironment,
): WorkerGroqClient {
  if (!environment.AI_REVIEW_ENABLED) {
    throw new Error(
      "AI review is disabled for this worker",
    );
  }

  if (!environment.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is unavailable",
    );
  }

  return new Groq({
    apiKey: environment.GROQ_API_KEY,

    timeout:
      environment
        .GROQ_REQUEST_TIMEOUT_MS,

    maxRetries: 2,
  });
}