import { NextResponse } from "next/server";

import { AttendanceMediaSyncRepository } from "@/features/attendance/repositories/attendance-media-sync.repository";
import { getAttendanceSelfieStorage } from "@/features/attendance/storage/attendance-selfie-storage.provider";
import { GoogleDriveAttendancePermanentStorage } from "@/features/attendance/storage/google-drive-attendance-permanent-storage";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  try {
    const actor = await requireCompanyAdmin("attendance");
    const { attachmentId } = await context.params;
    const attachment = await AttendanceMediaSyncRepository.findAuthorizedAttachment(
      attachmentId,
      actor.companyId,
    );
    if (!attachment) return NextResponse.json({ message: "Not found." }, { status: 404 });

    const media = attachment.drive_file_id && attachment.sync_status === "synced"
      ? await GoogleDriveAttendancePermanentStorage.download(attachment.drive_file_id)
      : attachment.source_deleted_at === null
        ? await getAttendanceSelfieStorage().download(attachment.source_object_path)
        : null;
    if (!media) return NextResponse.json({ message: "Media unavailable." }, { status: 404 });

    return new NextResponse(media.data, {
      headers: {
        "Content-Type": media.contentType,
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const denied = error instanceof Error && error.message.includes("access");
    return NextResponse.json(
      { message: denied ? "Forbidden." : "Unable to load media." },
      { status: denied ? 403 : 500 },
    );
  }
}
