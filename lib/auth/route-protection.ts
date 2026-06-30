import type { NextRequest } from "next/server";

import {
  PROTECTED_ROUTE_PREFIXES,
  PUBLIC_ROUTE_PREFIXES,
} from "@/features/auth/constants/auth-routes";

export function isProtectedRoute(request: NextRequest) {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
}

export function isPublicAuthRoute(request: NextRequest) {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
}
