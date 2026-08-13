import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const companyId = process.env.GOOGLE_SHEETS_REPORTING_COMPANY_ID?.trim();
  if (!companyId) {
    throw new Error("GOOGLE_SHEETS_REPORTING_COMPANY_ID is required.");
  }

  const [{ createSupabaseAdminClient }, { getGoogleIntegrationConfig }] =
    await Promise.all([
      import("@/lib/supabase/admin"),
      import("@/lib/google/config"),
    ]);
  const supabase = createSupabaseAdminClient();
  const { reportingSpreadsheetId } = getGoogleIntegrationConfig();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();
  if (companyError || !company)
    throw new Error("Reporting company was not found.");

  const { error: destinationError } = await supabase
    .from("reporting_destinations")
    .upsert(
      {
        company_id: companyId,
        dataset: "holidays",
        provider: "google_sheets",
        spreadsheet_id: reportingSpreadsheetId,
        sheet_name: "Holidays",
        enabled: true,
        sync_status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,dataset" },
    );
  if (destinationError)
    throw new Error("Unable to configure reporting destination.");

  const { data: enqueued, error: enqueueError } = await supabase.rpc(
    "enqueue_holiday_reporting_backfill",
    { target_company_id: companyId },
  );
  if (enqueueError) throw new Error("Unable to enqueue reporting backfill.");

  const { GoogleSheetsSyncService } =
    await import("@/features/reporting-sync/services/google-sheets-sync.service");
  const result = await GoogleSheetsSyncService.run({
    jobLimit: 50,
    reconciliationLimit: 1,
  });
  console.log(
    JSON.stringify({
      reportingDestination: "configured",
      backfillEnqueued: enqueued,
      worker: result,
    }),
  );
}

main().catch((error) => {
  console.error("google_sheets_configuration=failed", {
    errorType: error instanceof Error ? error.name : "unknown_error",
    message: error instanceof Error ? error.message : "unknown_error",
  });
  process.exitCode = 1;
});
