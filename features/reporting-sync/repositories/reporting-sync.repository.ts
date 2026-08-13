import "server-only";

import type {
  HolidayProjection,
  ReportingDestination,
  ReportingSyncJob,
} from "@/features/reporting-sync/types/reporting-sync.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function toDestination(row: {
  id: string;
  company_id: string;
  spreadsheet_id: string;
  sheet_name: string;
  alerted_at: string | null;
}): ReportingDestination {
  return {
    id: row.id,
    companyId: row.company_id,
    spreadsheetId: row.spreadsheet_id,
    sheetName: row.sheet_name,
    alertedAt: row.alerted_at,
  };
}

function toProjection(row: {
  id: string;
  date: string;
  title: string;
  holiday_type: string;
  is_working_day: boolean;
  description: string | null;
  status: string;
  updated_at: string;
  holiday_calendars: { name: string; status: string };
}): HolidayProjection {
  return {
    recordId: row.id,
    calendarName: row.holiday_calendars.name,
    calendarStatus: row.holiday_calendars.status,
    holidayDate: row.date,
    title: row.title,
    holidayType: row.holiday_type,
    isWorkingDay: row.is_working_day,
    description: row.description ?? "",
    eventStatus: row.status,
    sourceUpdatedAt: row.updated_at,
  };
}

const HOLIDAY_PROJECTION_SELECT =
  "id,date,title,holiday_type,is_working_day,description,status,updated_at,holiday_calendars!inner(name,status)";

export const ReportingSyncRepository = {
  async ensureDestination(companyId: string, spreadsheetId: string) {
    const supabase = createSupabaseAdminClient();
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .eq("status", "active")
      .eq("platform_status", "active")
      .maybeSingle();
    if (companyError || !company) {
      throw new Error("Reporting company configuration is invalid.");
    }

    const { error: insertError } = await supabase
      .from("reporting_destinations")
      .upsert(
        {
          company_id: companyId,
          dataset: "holidays",
          provider: "google_sheets",
          spreadsheet_id: spreadsheetId,
          sheet_name: "Holidays",
          enabled: true,
          sync_status: "pending",
        },
        { onConflict: "company_id,dataset", ignoreDuplicates: true },
      );
    if (insertError)
      throw new Error("Unable to configure reporting destination.");

    const { data: destination, error: destinationError } = await supabase
      .from("reporting_destinations")
      .select("id,spreadsheet_id,sheet_name,enabled")
      .eq("company_id", companyId)
      .eq("dataset", "holidays")
      .single();
    if (
      destinationError ||
      destination.spreadsheet_id !== spreadsheetId ||
      destination.sheet_name !== "Holidays" ||
      !destination.enabled
    ) {
      throw new Error("Reporting destination configuration does not match.");
    }

    const { error: enqueueError } = await supabase.rpc(
      "enqueue_holiday_reporting_backfill",
      { target_company_id: companyId },
    );
    if (enqueueError) throw new Error("Unable to enqueue reporting backfill.");
  },

  async claimJobs(
    workerId: string,
    limit: number,
  ): Promise<ReportingSyncJob[]> {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "claim_holiday_reporting_sync_jobs",
      { worker_id: workerId, job_limit: limit, lease_seconds: 180 },
    );
    if (error) throw new Error("Unable to claim reporting sync work.");
    return data.map((row) => ({
      outboxId: row.outbox_id,
      eventId: row.event_id,
      companyId: row.company_id,
      destinationId: row.destination_id,
      spreadsheetId: row.spreadsheet_id,
      sheetName: row.sheet_name,
      attemptCount: row.attempt_count,
    }));
  },

  async findProjection(eventId: string, companyId: string) {
    const { data, error } = await createSupabaseAdminClient()
      .from("holiday_events")
      .select(HOLIDAY_PROJECTION_SELECT)
      .eq("id", eventId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (error) throw new Error("Unable to load holiday reporting source.");
    return data ? toProjection(data) : null;
  },

  async listProjections(companyId: string) {
    const { data, error } = await createSupabaseAdminClient()
      .from("holiday_events")
      .select(HOLIDAY_PROJECTION_SELECT)
      .eq("company_id", companyId)
      .order("date", { ascending: true })
      .order("id", { ascending: true });
    if (error) throw new Error("Unable to load holiday reporting source.");
    return data.map(toProjection);
  },

  async completeJob(outboxId: string, workerId: string) {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "complete_holiday_reporting_sync_job",
      { target_outbox_id: outboxId, worker_id: workerId },
    );
    if (error || !data)
      throw new Error("Unable to complete reporting sync work.");
  },

  async failJob(outboxId: string, workerId: string, safeError: string) {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "fail_holiday_reporting_sync_job",
      {
        target_outbox_id: outboxId,
        worker_id: workerId,
        safe_error: safeError,
      },
    );
    if (error) throw new Error("Unable to release reporting sync work.");
    return data;
  },

  async listDueReconciliations(limit: number): Promise<ReportingDestination[]> {
    if (limit <= 0) return [];
    const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
    const { data, error } = await createSupabaseAdminClient()
      .from("reporting_destinations")
      .select("id,company_id,spreadsheet_id,sheet_name,alerted_at")
      .eq("enabled", true)
      .or(`last_reconciled_at.is.null,last_reconciled_at.lt.${cutoff}`)
      .order("last_reconciled_at", { ascending: true, nullsFirst: true })
      .limit(limit);
    if (error) throw new Error("Unable to load reporting reconciliation work.");
    return data.map(toDestination);
  },

  async completeReconciliation(
    destination: ReportingDestination,
    counts: {
      sourceRowCount: number;
      destinationRowCount: number;
      driftCount: number;
    },
  ) {
    const { error } = await createSupabaseAdminClient()
      .from("reporting_destinations")
      .update({
        sync_status: "healthy",
        last_reconciled_at: new Date().toISOString(),
        last_successful_sync_at: new Date().toISOString(),
        last_error: null,
        alerted_at: null,
        source_row_count: counts.sourceRowCount,
        destination_row_count: counts.destinationRowCount,
        drift_count: counts.driftCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", destination.id)
      .eq("company_id", destination.companyId);
    if (error) throw new Error("Unable to record reporting reconciliation.");
  },

  async failReconciliation(
    destination: ReportingDestination,
    safeError: string,
  ) {
    const { error } = await createSupabaseAdminClient()
      .from("reporting_destinations")
      .update({
        sync_status: "failed",
        last_attempt_at: new Date().toISOString(),
        last_error: safeError,
        updated_at: new Date().toISOString(),
      })
      .eq("id", destination.id)
      .eq("company_id", destination.companyId);
    if (error)
      throw new Error("Unable to record reporting reconciliation failure.");
  },

  async claimFailureAlert(destinationId: string) {
    const now = new Date().toISOString();
    const { data, error } = await createSupabaseAdminClient()
      .from("reporting_destinations")
      .update({ alerted_at: now, updated_at: now })
      .eq("id", destinationId)
      .is("alerted_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error("Unable to record reporting health alert.");
    return Boolean(data);
  },
};
