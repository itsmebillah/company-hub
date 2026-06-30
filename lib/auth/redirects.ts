import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function redirectToPath(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();

  url.pathname = path;
  url.search = "";

  return NextResponse.redirect(url);
}
