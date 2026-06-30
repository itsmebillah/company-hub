import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  const context = {
    response: NextResponse.next({
      request,
    }),
  };

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        context.response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          context.response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    get response() {
      return context.response;
    },
  };
}
