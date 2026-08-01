import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { AttendanceMediaSyncService } = await import(
    "@/features/attendance/services/attendance-media-sync.service"
  );
  const result = await AttendanceMediaSyncService.run({
    syncLimit: 10,
    cleanupLimit: 20,
  });
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error("attendance_media_worker=failed", {
    errorType: error instanceof Error ? error.name : "unknown_error",
  });
  process.exitCode = 1;
});
