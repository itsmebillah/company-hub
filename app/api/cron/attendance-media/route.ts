import { NextResponse } from "next/server";

import { AttendanceMediaSyncService } from "@/features/attendance/services/attendance-media-sync.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  try {
    return NextResponse.json(await AttendanceMediaSyncService.run());
  } catch (error) {
    console.error("[AttendanceMediaCronRoute] Worker failed.", {
      errorType: error instanceof Error ? error.name : "unknown_error",
    });
    return NextResponse.json({ message: "Attendance media processing failed." }, { status: 500 });
  }
}
