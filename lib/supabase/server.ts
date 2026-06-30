import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

type CreateSupabaseServerClientOptions = {
  rememberSession?: boolean;
};

const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30;

export async function createSupabaseServerClient(
  options: CreateSupabaseServerClientOptions = {},
) {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            const nextCookieOptions =
              options.rememberSession && typeof cookieOptions.maxAge === "number"
                ? { ...cookieOptions, maxAge: REMEMBER_ME_MAX_AGE }
                : cookieOptions;

            cookieStore.set(name, value, nextCookieOptions);
          });
        } catch {
          // Server Components cannot set cookies. Middleware can refresh them.
        }
      },
    },
  });
}
