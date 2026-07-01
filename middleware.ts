import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_REDIRECTS } from "@/features/auth/constants/auth-redirects";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { redirectToPath } from "@/lib/auth/redirects";
import { isProtectedRoute, isPublicAuthRoute } from "@/lib/auth/route-protection";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute(request) && !user) {
    return redirectToPath(request, AUTH_REDIRECTS.unauthenticated);
  }

  if (isPublicAuthRoute(request) && user) {
    return redirectToPath(request, AUTH_REDIRECTS.authenticatedFromAuthRoute);
  }

  if (isProtectedRoute(request) || isPublicAuthRoute(request)) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/announcements",
    "/dashboard",
    "/login",
    "/profile",
    "/register",
    "/resources",
    "/settings",
  ],
};
