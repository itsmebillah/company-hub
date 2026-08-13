import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.PHASE41_VERIFICATION_TOKEN;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      scope?: unknown;
    };
    if (body.scope === "drive") {
      const { createSupabaseAdminClient } =
        await import("@/lib/supabase/admin");
      const { GoogleDriveAttendancePermanentStorage } =
        await import("@/features/attendance/storage/google-drive-attendance-permanent-storage");
      const { data, error } = await createSupabaseAdminClient()
        .from("attendance_attachments")
        .select("drive_file_id")
        .eq("sync_status", "synced")
        .not("drive_file_id", "is", null);
      if (error) throw new Error("Unable to load Drive verification records.");
      let readableFiles = 0;
      let unreadableFiles = 0;
      for (const attachment of data) {
        if (!attachment.drive_file_id) continue;
        try {
          await GoogleDriveAttendancePermanentStorage.verify(
            attachment.drive_file_id,
          );
          readableFiles += 1;
        } catch {
          unreadableFiles += 1;
        }
      }
      return NextResponse.json(
        {
          verified: unreadableFiles === 0,
          provider: "google_drive",
          readableFiles,
          unreadableFiles,
        },
        { status: unreadableFiles === 0 ? 200 : 503 },
      );
    }

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
