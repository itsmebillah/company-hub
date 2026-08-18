import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { GoogleDriveClient } = await import("@/lib/google/drive-client");
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");

  const { data, error } = await createSupabaseAdminClient()
    .from("attendance_attachments")
    .select("drive_file_id")
    .not("drive_file_id", "is", null);
  if (error)
    throw new Error("Unable to load stored attendance Drive references.");

  const fileIds = [
    ...new Set(
      (data ?? [])
        .map((row) => row.drive_file_id)
        .filter((fileId): fileId is string => Boolean(fileId)),
    ),
  ];
  console.log(`attendance_drive_files_discovered=${fileIds.length}`);

  await GoogleDriveClient.getSelfiesFolder();
  console.log("selfies_folder=app_authorized");
  for (const fileId of fileIds) await GoogleDriveClient.getFile(fileId);

  console.log(`attendance_drive_files_checked=${fileIds.length}`);
  console.log(`attendance_drive_files_app_authorized=${fileIds.length}`);
  console.log("drive_authorization_audit=verified");
}

main().catch((error) => {
  console.error(
    `drive_authorization_audit=failed:${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
