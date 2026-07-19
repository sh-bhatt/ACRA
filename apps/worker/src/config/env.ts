import { z } from "zod";

const workerEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  WORKER_ID: z
    .string()
    .trim()
    .min(1)
    .default("acra-worker-local"),

  SUPABASE_URL: z
    .string()
    .url("SUPABASE_URL must be a valid URL"),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY is required"),
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
        const path = issue.path.join(".");
        return `${path}: ${issue.message}`;
      })
      .join("; ");

    throw new Error(
      `Invalid worker environment variables: ${message}`,
    );
  }

  return result.data;
}