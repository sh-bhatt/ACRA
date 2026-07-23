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
          }),

          signal:
            controller.signal,
        },
      );

    if (!response.ok) {
      const body =
        await response.text();

      throw new Error(
        `Groq API returned ${response.status}: ${body}`,
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