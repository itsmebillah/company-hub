import { loadEnvConfig } from "@next/env";

import { SCHEMA_MIGRATION_MANIFEST } from "@/features/schema-version/constants/schema-migrations";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const { GoogleDriveAttendancePermanentStorage } = await import(
    "@/features/attendance/storage/google-drive-attendance-permanent-storage"
  );
  const { getAttendanceSelfieStorage } = await import(
    "@/features/attendance/storage/attendance-selfie-storage.provider"
  );
  const supabase = createSupabaseAdminClient();
  const { data: schemaVersion, error: schemaError } = await supabase.rpc(
    "get_app_schema_version",
  );
  const expectedSchemaVersion =
    SCHEMA_MIGRATION_MANIFEST.at(-1)?.match(/^(\d{4})_/)?.[1];
  if (
    schemaError ||
    !expectedSchemaVersion ||
    schemaVersion !== expectedSchemaVersion
  ) {
    throw new Error("Attendance media schema version is not active.");
  }
  const { data, error } = await supabase
    .from("attendance_attachments")
    .select("drive_file_id,source_object_path,source_deleted_at,sync_status,synced_at,purge_after");
  if (error) throw new Error("Unable to verify attendance media metadata.");

  const synced = data.filter((item) => item.sync_status === "synced");
  const cache = getAttendanceSelfieStorage();
  const now = Date.now();
  for (const item of synced) {
    if (!item.drive_file_id || !item.synced_at || !item.purge_after) {
      throw new Error("Synchronized attendance media metadata is incomplete.");
    }
    await GoogleDriveAttendancePermanentStorage.verify(item.drive_file_id);
    if (item.source_deleted_at === null && !(await cache.exists(item.source_object_path))) {
      throw new Error("Retained attendance selfie cache is missing.");
    }
    const retention = new Date(item.purge_after).getTime() - new Date(item.synced_at).getTime();
    if (retention < 259_000_000 || new Date(item.purge_after).getTime() <= now) {
      throw new Error("Attendance selfie retention deadline is invalid.");
    }
  }

  const { count: pendingOutbox, error: outboxError } = await supabase
    .from("integration_outbox")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "attendance.selfie.sync")
    .neq("status", "completed");
  if (outboxError) throw new Error("Unable to verify attendance media outbox.");

  console.log(`attachments_total=${data.length}`);
  console.log(`attachments_synced=${synced.length}`);
  console.log(`drive_files_verified=${synced.length}`);
  console.log(`cache_objects_retained=${synced.filter((item) => item.source_deleted_at === null).length}`);
  console.log(`pending_outbox=${pendingOutbox ?? 0}`);
  console.log("retention_window=verified");
  console.log(`schema_version=${expectedSchemaVersion}`);
}

main().catch((error) => {
  console.error("attendance_media_verification=failed", {
    errorType: error instanceof Error ? error.name : "unknown_error",
  });
  process.exitCode = 1;
});
