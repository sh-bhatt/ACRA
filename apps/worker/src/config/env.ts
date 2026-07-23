import { z } from "zod";

const optionalEnvironmentVariable =
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const normalizedValue =
        value.trim();

      return normalizedValue.length > 0
        ? normalizedValue
        : undefined;
    },
    z.string().min(1).optional(),
  );

const booleanEnvironmentVariable =
  z.preprocess(
    (value) => {
      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value !== "string") {
        return value;
      }

      const normalizedValue =
        value.trim().toLowerCase();

      if (normalizedValue === "true") {
        return true;
      }

      if (normalizedValue === "false") {
        return false;
      }

      return value;
    },
    z.boolean(),
  );

const workerEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum([
        "development",
        "test",
        "production",
      ])
      .default("development"),

    WORKER_ID: z
      .string()
      .trim()
      .min(
        1,
        "WORKER_ID is required",
      )
      .default("acra-worker-local"),

    SUPABASE_URL: z
      .string()
      .trim()
      .url(
        "SUPABASE_URL must be a valid URL",
      ),

    SUPABASE_SECRET_KEY: z
      .string()
      .trim()
      .min(
        1,
        "SUPABASE_SECRET_KEY is required",
      ),

    AI_REVIEW_ENABLED:
      booleanEnvironmentVariable
        .default(false),

    GROQ_API_KEY:
      optionalEnvironmentVariable,

    GROQ_MODEL: z
      .string()
      .trim()
      .min(
        1,
        "GROQ_MODEL cannot be empty",
      )
      .default(
        "openai/gpt-oss-120b",
      ),

    GROQ_REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(5_000)
      .max(180_000)
      .default(90_000),
  })
  .superRefine(
    (environment, context) => {
      if (
        environment.AI_REVIEW_ENABLED &&
        !environment.GROQ_API_KEY
      ) {
        context.addIssue({
          code: "custom",
          path: ["GROQ_API_KEY"],
          message:
            "GROQ_API_KEY is required when AI_REVIEW_ENABLED is true",
        });
      }
    },
  );

export type WorkerEnvironment =
  z.infer<
    typeof workerEnvironmentSchema
  >;

export function getWorkerEnvironment(
  environment: NodeJS.ProcessEnv =
    process.env,
): WorkerEnvironment {
  const result =
    workerEnvironmentSchema.safeParse(
      environment,
    );

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const path =
          issue.path.length > 0
            ? issue.path.join(".")
            : "environment";

        return `${path}: ${issue.message}`;
      })
      .join("; ");

    throw new Error(
      `Invalid worker environment variables: ${message}`,
    );
  }

  return result.data;
}