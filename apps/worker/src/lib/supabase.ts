import type { Database } from "@acra/database";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type { WorkerEnvironment } from "../config/env.js";

export type WorkerSupabaseClient =
  SupabaseClient<Database>;

export function createWorkerSupabaseClient(
  environment: WorkerEnvironment,
): WorkerSupabaseClient {
  return createClient<Database>(
    environment.SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}