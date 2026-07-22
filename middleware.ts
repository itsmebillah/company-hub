import { NextResponse, type NextRequest } from "next/server";

import { AUTH_REDIRECTS } from "@/features/auth/constants/auth-redirects";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { redirectToPath } from "@/lib/auth/redirects";
import {
  isProtectedRoute,
  isPublicAuthRoute,
} from "@/lib/auth/route-protection";
import { getRouteFeature } from "@/features/platform-control/constants/feature-catalog";

export async function middleware(request: NextRequest) {
  const middlewareClient = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
  } = await middlewareClient.supabase.auth.getUser();

  if (isProtectedRoute(request) && !user) {
    return redirectToPath(request, AUTH_REDIRECTS.unauthenticated);
  }

  if (user && !request.nextUrl.pathname.startsWith("/platform")) {
    const { data: companyAllowed, error: companyError } =
      await middlewareClient.supabase.rpc("can_access_company_platform");
    if (companyError || !companyAllowed) {
      await middlewareClient.supabase.rpc("log_company_access_denied", {
        target_path: request.nextUrl.pathname,
        target_user_agent: request.headers.get("user-agent"),
      });
      return NextResponse.rewrite(new URL("/not-found", request.url), {
        headers: middlewareClient.response.headers,
        status: 404,
      });
    }
  }

  const featureKey = user ? getRouteFeature(request.nextUrl.pathname) : null;

  if (featureKey) {
    const { data: allowed, error } = await middlewareClient.supabase.rpc(
      "can_access_feature",
      { target_feature_key: featureKey },
    );

    if (error || !allowed) {
      await middlewareClient.supabase.rpc("log_feature_access_denied", {
        target_feature_key: featureKey,
        target_path: request.nextUrl.pathname,
        target_user_agent: request.headers.get("user-agent"),
      });

      return NextResponse.rewrite(new URL("/not-found", request.url), {
        headers: middlewareClient.response.headers,
        status: 404,
      });
    }

    if (request.method === "GET") {
      await middlewareClient.supabase.rpc("record_feature_usage", {
        target_feature_key: featureKey,
      });
    }
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
    "/platform/:path*",
    "/register",
    "/resources/:path*",
    "/settings/:path*",
  ],
};
