import {
  aiReviewResultSchema,
  type AIReviewResult,
} from "@acra/review-schema";

import {
  buildReviewPrompt,
  type BuildReviewPromptInput,
} from "./build-review-prompt.js";

import { aiReviewJsonSchema } from "./ai-review-json-schema.js";

import {
  createGroqChatCompletion,
  GroqApiError,
} from "./groq-client.js";

const MAX_ATTEMPTS = 3;

// Groq occasionally serializes array items (e.g. individual findings) as
// JSON-encoded strings instead of nested objects, even when using
// json_schema response mode. Detect and unwrap those before validation
// so a cosmetic serialization quirk doesn't fail the whole review.
function normalizeStringifiedObjects(
  value: unknown,
): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (
    !trimmed.startsWith("{") &&
    !trimmed.startsWith("[")
  ) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Not actually JSON — leave as-is and let Zod report the real error.
    return value;
  }
}

function normalizeParsedReview(
  parsed: Record<string, unknown>,
): Record<string, unknown> {
  if (Array.isArray(parsed.findings)) {
    parsed.findings = parsed.findings.map(
      normalizeStringifiedObjects,
    );
  }

  parsed.refactoringPlan ??= [];
  parsed.generatedDocumentation ??= null;

  return parsed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

// Groq's 429 body includes a suggested wait time, e.g:
// "Please try again in 28.4325s."
// Fall back to a fixed delay if we can't parse one out.
function extractRetryDelayMs(
  message: string,
): number {
  const match = message.match(
    /try again in ([\d.]+)s/i,
  );

  const rawSeconds = match?.[1];

  if (rawSeconds !== undefined) {
    const seconds =
      Number.parseFloat(rawSeconds);

    if (Number.isFinite(seconds)) {
      // Small buffer on top of Groq's own estimate.
      return Math.ceil(seconds * 1000) + 500;
    }
  }

  return 5000;
}

export async function generateAIReview(
  input: BuildReviewPromptInput,
): Promise<AIReviewResult> {
  const prompt =
    buildReviewPrompt(input);

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt += 1
  ) {
    try {
      const content =
        await createGroqChatCompletion({
          messages: [
            {
              role: "system",
              content:
                prompt.systemPrompt,
            },
            {
              role: "user",
              content:
                prompt.userPrompt,
            },
          ],

          responseFormat: {
            type: "json_schema",

            json_schema: {
              name: "review",

              schema:
                aiReviewJsonSchema,
            },
          },
        });

      const parsed =
        normalizeParsedReview(
          JSON.parse(content),
        );

      return aiReviewResultSchema.parse(
        parsed,
      );
    } catch (error: unknown) {
      lastError = error;

      const isLastAttempt =
        attempt === MAX_ATTEMPTS;

      if (
        error instanceof GroqApiError &&
        error.status === 429
      ) {
        const delayMs =
          extractRetryDelayMs(
            error.body,
          );

        console.warn(
          [
            `[ai] rate limited on attempt ${attempt}/${MAX_ATTEMPTS},`,
            `waiting ${delayMs}ms before retry`,
          ].join(" "),
        );

        if (!isLastAttempt) {
          await sleep(delayMs);
          continue;
        }
      } else {
        console.warn(
          [
            `[ai] attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
            error instanceof Error
              ? error.message
              : String(error),
          ].join(" "),
        );

        if (!isLastAttempt) {
          continue;
        }
      }
    }
  }

  throw lastError;
}