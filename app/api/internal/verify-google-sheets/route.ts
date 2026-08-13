import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.PHASE41_VERIFICATION_TOKEN;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { verifyGoogleSheetsSync } =
      await import("@/scripts/verify-google-sheets-sync");
    await verifyGoogleSheetsSync();
    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("[GoogleSheetsVerificationRoute] Verification failed.", {
      errorType: error instanceof Error ? error.name : "unknown_error",
    });
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
