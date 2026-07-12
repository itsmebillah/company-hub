import { NextResponse } from "next/server";

import { CelebrationService } from "@/features/celebrations/services/celebration.service";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await CelebrationService.runScheduledCelebrations();

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CelebrationCronRoute] Unable to run celebrations.", error);

    return NextResponse.json(
      { message: "Unable to run celebrations." },
      { status: 500 },
    );
  }
}
