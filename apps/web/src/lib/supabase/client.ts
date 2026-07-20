import type { Database } from "@acra/database";
import { createBrowserClient } from "@supabase/ssr";

import { getClientEnvironment } from "@/lib/env/client";

export function createClient() {
  const environment = getClientEnvironment();

  return createBrowserClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}