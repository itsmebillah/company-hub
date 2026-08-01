import "server-only";

import { AttendanceMediaSyncRepository } from "@/features/attendance/repositories/attendance-media-sync.repository";
import { getAttendanceSelfieStorage } from "@/features/attendance/storage/attendance-selfie-storage.provider";
import { GoogleDriveAttendancePermanentStorage } from "@/features/attendance/storage/google-drive-attendance-permanent-storage";

function classifyError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.includes("cache")) return "source_cache_unavailable";
  if (error instanceof Error && error.message.includes("verification")) return "drive_verification_failed";
  return fallback;
}

export const AttendanceMediaSyncService = {
  async run(input: { syncLimit?: number; cleanupLimit?: number } = {}) {
    const workerId = crypto.randomUUID();
    const cache = getAttendanceSelfieStorage();
    const permanent = GoogleDriveAttendancePermanentStorage;
    const result = { syncClaimed: 0, synced: 0, syncFailed: 0, cleanupClaimed: 0, cleaned: 0, cleanupFailed: 0 };

    const syncJobs = await AttendanceMediaSyncRepository.claimSync(workerId, input.syncLimit ?? 10);
    result.syncClaimed = syncJobs.length;
    for (const job of syncJobs) {
      try {
        let stored = job.drive_file_id
          ? await permanent.verify(job.drive_file_id)
          : await permanent.find(job.attachment_id);
        if (!stored) {
          const source = await cache.download(job.source_object_path);
          stored = await permanent.upload({
            attachmentId: job.attachment_id,
            objectPath: job.source_object_path,
            data: source.data,
            contentType: source.contentType,
          });
        }
        stored = await permanent.verify(stored.externalFileId);
        await AttendanceMediaSyncRepository.completeSync({
          outboxId: job.outbox_id,
          workerId,
          driveFileId: stored.externalFileId,
          driveFolderId: stored.folderId,
          driveUrl: stored.viewUrl,
        });
        result.synced += 1;
      } catch (error) {
        result.syncFailed += 1;
        const safeError = classifyError(error, "drive_sync_failed");
        console.error("[AttendanceMediaSyncService] Sync failed.", { attachmentId: job.attachment_id, safeError });
        await AttendanceMediaSyncRepository.failSync(job.outbox_id, workerId, safeError);
      }
    }

    const cleanupJobs = await AttendanceMediaSyncRepository.claimCleanup(workerId, input.cleanupLimit ?? 20);
    result.cleanupClaimed = cleanupJobs.length;
    for (const job of cleanupJobs) {
      try {
        await permanent.verify(job.drive_file_id);
        if (await cache.exists(job.source_object_path)) await cache.remove(job.source_object_path);
        if (await cache.exists(job.source_object_path)) throw new Error("Cache deletion verification failed.");
        await AttendanceMediaSyncRepository.completeCleanup(job.attachment_id, workerId);
        result.cleaned += 1;
      } catch (error) {
        result.cleanupFailed += 1;
        const safeError = classifyError(error, "cache_cleanup_failed");
        console.error("[AttendanceMediaSyncService] Cleanup failed.", { attachmentId: job.attachment_id, safeError });
        await AttendanceMediaSyncRepository.failCleanup(job.attachment_id, workerId, safeError);
      }
    }

    console.info("[AttendanceMediaSyncService] Worker complete.", result);
    return result;
  },
};
