import type { Database } from "@acra/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getClientEnvironment } from "@/lib/env/client";

export async function createClient() {
  const cookieStore = await cookies();
  const environment = getClientEnvironment();

  return createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Proxy handles session-cookie refresh when
            // Server Components cannot write cookies.
          }
        },
      },
    },
  );
}