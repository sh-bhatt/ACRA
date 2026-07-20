import { z } from "zod";

const optionalEnvironmentVariable = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalizedValue = value.trim();

    return normalizedValue.length > 0
      ? normalizedValue
      : undefined;
  },
  z.string().min(1).optional(),
);

const workerEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  WORKER_ID: z
    .string()
    .trim()
    .min(1, "WORKER_ID is required")
    .default("acra-worker-local"),

  SUPABASE_URL: z
    .string()
    .trim()
    .url("SUPABASE_URL must be a valid URL"),

  SUPABASE_SECRET_KEY: z
    .string()
    .trim()
    .min(1, "SUPABASE_SECRET_KEY is required"),

  OPENAI_API_KEY: optionalEnvironmentVariable,
});

export type WorkerEnvironment = z.infer<
  typeof workerEnvironmentSchema
>;

export function getWorkerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): WorkerEnvironment {
  const result = workerEnvironmentSchema.safeParse(environment);

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