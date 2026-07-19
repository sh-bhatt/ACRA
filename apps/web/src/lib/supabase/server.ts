import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getClientEnvironment } from "@/lib/env/client";

export async function createClient() {
  const cookieStore = await cookies();
  const environment = getClientEnvironment();

  return createServerClient(
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
            // Server Components cannot always write cookies.
            // The authentication proxy will handle session refresh.
          }
        },
      },
    },
  );
}