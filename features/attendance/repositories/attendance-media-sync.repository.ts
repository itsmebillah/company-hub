import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const AttendanceMediaSyncRepository = {
  async claimSync(workerId: string, limit: number) {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "claim_attendance_media_sync_jobs",
      { worker_id: workerId, job_limit: limit, lease_seconds: 180 },
    );
    if (error) throw new Error("Unable to claim attendance media sync work.");
    return data;
  },

  async completeSync(input: {
    outboxId: string;
    workerId: string;
    driveFileId: string;
    driveFolderId: string;
    driveUrl: string;
  }) {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "complete_attendance_media_sync_job",
      {
        target_outbox_id: input.outboxId,
        worker_id: input.workerId,
        target_drive_file_id: input.driveFileId,
        target_drive_folder_id: input.driveFolderId,
        target_drive_url: input.driveUrl,
      },
    );
    if (error || !data) throw new Error("Unable to complete attendance media sync work.");
  },

  async failSync(outboxId: string, workerId: string, safeError: string) {
    const { error } = await createSupabaseAdminClient().rpc(
      "fail_attendance_media_sync_job",
      { target_outbox_id: outboxId, worker_id: workerId, safe_error: safeError },
    );
    if (error) console.error("[AttendanceMediaSyncRepository] Unable to release sync job.", { outboxId });
  },

  async claimCleanup(workerId: string, limit: number) {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "claim_attendance_media_cleanup_jobs",
      { worker_id: workerId, job_limit: limit, lease_seconds: 180 },
    );
    if (error) throw new Error("Unable to claim attendance media cleanup work.");
    return data;
  },

  async completeCleanup(attachmentId: string, workerId: string) {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "complete_attendance_media_cleanup_job",
      { target_attachment_id: attachmentId, worker_id: workerId },
    );
    if (error || !data) throw new Error("Unable to complete attendance media cleanup work.");
  },

  async failCleanup(attachmentId: string, workerId: string, safeError: string) {
    const { error } = await createSupabaseAdminClient().rpc(
      "fail_attendance_media_cleanup_job",
      { target_attachment_id: attachmentId, worker_id: workerId, safe_error: safeError },
    );
    if (error) console.error("[AttendanceMediaSyncRepository] Unable to release cleanup job.", { attachmentId });
  },

  async findByAttendance(attendanceRecordId: string, companyId: string) {
    const { data, error } = await createSupabaseAdminClient()
      .from("attendance_attachments")
      .select("id,phase,sync_status,cache_status,drive_url,synced_at,purge_after,last_error")
      .eq("attendance_record_id", attendanceRecordId)
      .eq("company_id", companyId);
    if (error) throw new Error("Unable to load attendance media status.");
    return data;
  },

  async findAuthorizedAttachment(attachmentId: string, companyId: string) {
    const { data, error } = await createSupabaseAdminClient()
      .from("attendance_attachments")
      .select("id,company_id,source_object_path,source_deleted_at,drive_file_id,sync_status")
      .eq("id", attachmentId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (error) throw new Error("Unable to load attendance media.");
    return data;
  },
};
