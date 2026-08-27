import { NextResponse } from "next/server";
import { FcmDeliveryService } from "@/features/notifications/services/fcm-delivery.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return secret ? request.headers.get("authorization") === `Bearer ${secret}` : process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  try { return NextResponse.json(await FcmDeliveryService.processPending(20)); }
  catch (error) { console.error("[FcmCronRoute] Worker failed.", { errorType: error instanceof Error ? error.name : "unknown_error" }); return NextResponse.json({ message: "FCM processing failed." }, { status: 500 }); }
}