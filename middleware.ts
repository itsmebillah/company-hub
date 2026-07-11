import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_REDIRECTS } from "@/features/auth/constants/auth-redirects";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { redirectToPath } from "@/lib/auth/redirects";
import { isProtectedRoute, isPublicAuthRoute } from "@/lib/auth/route-protection";

export async function middleware(request: NextRequest) {
  const middlewareClient = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
  } = await middlewareClient.supabase.auth.getUser();

  if (isProtectedRoute(request) && !user) {
    return redirectToPath(request, AUTH_REDIRECTS.unauthenticated);
  }

  if (isProtectedRoute(request) || isPublicAuthRoute(request)) {
    middlewareClient.response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    middlewareClient.response.headers.set("Pragma", "no-cache");
    middlewareClient.response.headers.set("Expires", "0");
  }

  return middlewareClient.response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/announcements/:path*",
    "/attendance/:path*",
    "/calendar/:path*",
    "/dashboard/:path*",
    "/leave/:path*",
    "/login",
    "/profile/:path*",
    "/register",
    "/resources/:path*",
    "/settings/:path*",
  ],
};
