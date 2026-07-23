import { getWorkerEnvironment } from "../config/env.js";
import { buildReviewPrompt } from "./build-review-prompt.js";
import { aiReviewJsonSchema } from "./ai-review-json-schema.js";

export type RunAIReviewInput = Parameters<
  typeof buildReviewPrompt
>[0];

export async function runAIReview(
  input: RunAIReviewInput,
) {
  const env = getWorkerEnvironment();

  if (!env.AI_REVIEW_ENABLED) {
    throw new Error(
      "AI review is disabled",
    );
  }

  const prompt =
    buildReviewPrompt(input);

  const response =
    await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          model: env.GROQ_MODEL,

          temperature: 0,

          response_format: {
            type: "json_schema",

            json_schema: {
              name: "review",

              schema:
                aiReviewJsonSchema,

              strict: true,
            },
          },

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
        }),
      },
    );

  if (!response.ok) {
    throw new Error(
      `Groq request failed (${response.status})`,
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
      "Groq returned empty response",
    );
  }

  return JSON.parse(content);
}