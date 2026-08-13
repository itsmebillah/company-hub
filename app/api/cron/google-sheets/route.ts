import { NextResponse } from "next/server";

import { GoogleSheetsSyncService } from "@/features/reporting-sync/services/google-sheets-sync.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    return NextResponse.json(
      await GoogleSheetsSyncService.run({
        jobLimit: 20,
        reconciliationLimit: 1,
      }),
    );
  } catch (error) {
    console.error("[GoogleSheetsCronRoute] Worker failed.", {
      errorType: error instanceof Error ? error.name : "unknown_error",
    });
    return NextResponse.json(
      { message: "Google Sheets processing failed." },
      { status: 500 },
    );
  }
}
