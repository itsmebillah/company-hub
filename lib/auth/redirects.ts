import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function redirectToPath(
  request: NextRequest,
  path: string,
  sourceResponse?: NextResponse,
) {
  if (!path.startsWith("/")) {
    throw new Error("Redirect paths must be application-relative.");
  }

  const response = NextResponse.redirect(new URL(path, request.url));

  sourceResponse?.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}
