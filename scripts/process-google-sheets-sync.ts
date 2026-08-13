import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { GoogleSheetsSyncService } =
    await import("@/features/reporting-sync/services/google-sheets-sync.service");
  const result = await GoogleSheetsSyncService.run({
    jobLimit: 20,
    reconciliationLimit: 1,
  });
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error("google_sheets_worker=failed", {
    errorType: error instanceof Error ? error.name : "unknown_error",
  });
  process.exitCode = 1;
});
