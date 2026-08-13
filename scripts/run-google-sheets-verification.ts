import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const { verifyGoogleSheetsSync } =
  await import("@/scripts/verify-google-sheets-sync");

verifyGoogleSheetsSync().catch((error) => {
  console.error("google_sheets_sync_verification=failed", {
    errorType: error instanceof Error ? error.name : "unknown_error",
    message: error instanceof Error ? error.message : "unknown_error",
  });
  process.exitCode = 1;
});
