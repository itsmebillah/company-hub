export async function verifyGoogleSheetsSync() {
  const [
    { createSupabaseAdminClient },
    { GoogleSheetsSyncService },
    projection,
  ] = await Promise.all([
    import("@/lib/supabase/admin"),
    import("@/features/reporting-sync/services/google-sheets-sync.service"),
    import("@/features/reporting-sync/services/holiday-reporting-projection"),
  ]);
  const { GoogleSheetsClient } = await import("@/lib/google/sheets-client");
  const supabase = createSupabaseAdminClient();
  await GoogleSheetsSyncService.run({ jobLimit: 1, reconciliationLimit: 0 });
  const { data: destinations, error: destinationError } = await supabase
    .from("reporting_destinations")
    .select("id,company_id,spreadsheet_id,sheet_name")
    .eq("dataset", "holidays")
    .eq("enabled", true);
  if (destinationError || destinations.length !== 1) {
    throw new Error(
      "Exactly one enabled holiday reporting destination is required.",
    );
  }

  const destination = destinations[0];
  const marker = `sync-verification-${Date.now()}`;
  let calendarId: string | null = null;
  let eventId: string | null = null;

  async function readMatchingRows() {
    if (!eventId) return [];
    const range = `${projection.quoteSheetName(destination.sheet_name)}!A2:J`;
    const rows =
      (await GoogleSheetsClient.readValues(range, destination.spreadsheet_id))
        .values ?? [];
    return rows.filter((row) => row[0] === eventId);
  }

  try {
    const { data: calendar, error: calendarError } = await supabase
      .from("holiday_calendars")
      .insert({
        company_id: destination.company_id,
        name: marker,
        description: "Disposable Sheets sync verification",
        is_default: false,
        status: "active",
      })
      .select("id")
      .single();
    if (calendarError || !calendar)
      throw new Error("Unable to create verification calendar.");
    calendarId = calendar.id;

    const { data: event, error: eventError } = await supabase
      .from("holiday_events")
      .insert({
        calendar_id: calendarId,
        company_id: destination.company_id,
        title: marker,
        holiday_type: "company_holiday",
        date: "2099-12-30",
        is_working_day: false,
        description: "Disposable Sheets sync verification",
        status: "active",
      })
      .select("id")
      .single();
    if (eventError || !event)
      throw new Error("Unable to create verification holiday.");
    eventId = event.id;

    const initial = await GoogleSheetsSyncService.run({
      jobLimit: 20,
      reconciliationLimit: 0,
    });
    if (initial.synced < 1 || (await readMatchingRows()).length !== 1) {
      throw new Error("Initial sync verification failed.");
    }

    const updatedTitle = `${marker}-updated`;
    const { error: updateError } = await supabase
      .from("holiday_events")
      .update({ title: updatedTitle, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .eq("company_id", destination.company_id);
    if (updateError) throw new Error("Unable to update verification holiday.");
    await GoogleSheetsSyncService.run({ jobLimit: 20, reconciliationLimit: 0 });
    const updatedRows = await readMatchingRows();
    if (updatedRows.length !== 1 || updatedRows[0][4] !== updatedTitle) {
      throw new Error("Update or idempotency verification failed.");
    }

    const { error: retryUpdateError } = await supabase
      .from("holiday_events")
      .update({
        description: "Retry recovery verification",
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .eq("company_id", destination.company_id);
    if (retryUpdateError)
      throw new Error("Unable to create retry verification work.");

    const workerId = crypto.randomUUID();
    const { data: claimed, error: claimError } = await supabase.rpc(
      "claim_holiday_reporting_sync_jobs",
      { worker_id: workerId, job_limit: 1, lease_seconds: 180 },
    );
    if (claimError || claimed.length !== 1)
      throw new Error("Unable to claim retry verification work.");
    const { data: failedState, error: failError } = await supabase.rpc(
      "fail_holiday_reporting_sync_job",
      {
        target_outbox_id: claimed[0].outbox_id,
        worker_id: workerId,
        safe_error: "verification_transient_failure",
      },
    );
    if (failError || failedState !== "pending")
      throw new Error("Retry state verification failed.");
    const { data: retried, error: retryError } = await supabase.rpc(
      "retry_holiday_reporting_sync_job",
      { target_outbox_id: claimed[0].outbox_id },
    );
    if (retryError || !retried)
      throw new Error("Retry release verification failed.");
    const recovered = await GoogleSheetsSyncService.run({
      jobLimit: 20,
      reconciliationLimit: 0,
    });
    if (recovered.synced !== 1 || (await readMatchingRows()).length !== 1) {
      throw new Error("Retry recovery verification failed.");
    }

    const { data: outboxRows, error: outboxError } = await supabase
      .from("integration_outbox")
      .select("status,attempt_count,last_error")
      .eq("aggregate_id", eventId)
      .eq("event_type", "reporting.holiday.sync");
    if (
      outboxError ||
      outboxRows.some((row) => row.status !== "completed") ||
      !outboxRows.some((row) => row.attempt_count >= 2)
    ) {
      throw new Error("Durable outbox lifecycle verification failed.");
    }

    console.log("google_sheets_create_update=verified");
    console.log("google_sheets_idempotency=verified");
    console.log("google_sheets_retry_recovery=verified");
    console.log("google_sheets_outbox_lifecycle=verified");
  } finally {
    if (eventId) {
      await supabase
        .from("holiday_events")
        .delete()
        .eq("id", eventId)
        .eq("company_id", destination.company_id);
      await GoogleSheetsSyncService.run({
        jobLimit: 20,
        reconciliationLimit: 0,
      });
      if ((await readMatchingRows()).length !== 0) {
        throw new Error("Verification Sheet cleanup failed.");
      }
      await supabase
        .from("integration_outbox")
        .delete()
        .eq("aggregate_id", eventId)
        .eq("event_type", "reporting.holiday.sync");
    }
    if (calendarId) {
      await supabase.from("holiday_calendars").delete().eq("id", calendarId);
    }
  }
}
