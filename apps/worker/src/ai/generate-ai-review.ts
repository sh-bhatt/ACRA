import {
  aiReviewResultSchema,
  type AIReviewResult,
} from "@acra/review-schema";

import {
  buildReviewPrompt,
  type BuildReviewPromptInput,
} from "./build-review-prompt.js";

import { aiReviewJsonSchema } from "./ai-review-json-schema.js";

import { createGroqChatCompletion } from "./groq-client.js";

export async function generateAIReview(
  input: BuildReviewPromptInput,
): Promise<AIReviewResult> {
  const prompt =
    buildReviewPrompt(input);

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
    JSON.parse(content);

  return aiReviewResultSchema.parse(
    parsed,
  );
}