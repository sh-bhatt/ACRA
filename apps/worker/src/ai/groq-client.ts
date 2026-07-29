import { getWorkerEnvironment } from "../config/env.js";

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqResponseFormat =
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        schema: Record<string, unknown>;
      };
    }
  | undefined;

export type CreateGroqChatCompletionInput = {
  messages: readonly GroqMessage[];
  responseFormat?: GroqResponseFormat;
};

// Without an explicit cap, Groq falls back to a model default that can
// be smaller than a full findings array needs, causing the response to
// be truncated mid-JSON. Not read from env for now — add GROQ_MAX_TOKENS
// to the env schema later if you want this configurable per-deploy.
const DEFAULT_MAX_TOKENS = 4096;

/**
 * Thrown when the Groq API returns a non-OK response. Carries the HTTP
 * status code so callers can distinguish retryable conditions (e.g. 429
 * rate limits) from permanent failures (e.g. 400 invalid request).
 */
export class GroqApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Groq API returned ${status}: ${body}`);
    this.name = "GroqApiError";
    this.status = status;
    this.body = body;
  }
}

export async function createGroqChatCompletion(
  input: CreateGroqChatCompletionInput,
): Promise<string> {
  const env = getWorkerEnvironment();

  if (!env.AI_REVIEW_ENABLED) {
    throw new Error(
      "AI review is disabled.",
    );
  }

  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    env.GROQ_REQUEST_TIMEOUT_MS,
  );

  try {
    const response =
      await fetch(
        GROQ_API_URL,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            model: env.GROQ_MODEL,

            temperature: 0.2,

            messages: input.messages,

            response_format:
              input.responseFormat,

            max_tokens:
              DEFAULT_MAX_TOKENS,
          }),

          signal:
            controller.signal,
        },
      );

    if (!response.ok) {
      const body =
        await response.text();

      throw new GroqApiError(
        response.status,
        body,
      );
    }

    const json =
      await response.json();

    const content =
      json.choices?.[0]?.message
        ?.content;

    if (
      typeof content !== "string"
    ) {
      throw new Error(
        "Groq response did not contain message content.",
      );
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}