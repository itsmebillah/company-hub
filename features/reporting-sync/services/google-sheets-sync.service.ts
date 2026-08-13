import "server-only";

import { GoogleSheetsHolidayProjection } from "@/features/reporting-sync/integrations/google-sheets-holiday-projection";
import { ReportingSyncRepository } from "@/features/reporting-sync/repositories/reporting-sync.repository";
import { runReportingWorker } from "@/features/reporting-sync/services/reporting-sync.worker";
import type { ReportingDestination } from "@/features/reporting-sync/types/reporting-sync.types";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { getGoogleIntegrationConfig } from "@/lib/google/config";

async function alertFailure(destination: ReportingDestination) {
  if (!(await ReportingSyncRepository.claimFailureAlert(destination.id)))
    return;
  await NotificationService.create({
    companyId: destination.companyId,
    employeeId: null,
    type: "system",
    priority: "high",
    title: "Google Sheets sync needs attention",
    message:
      "Holiday reporting could not be synchronized after automatic recovery attempts.",
    actionUrl: "/admin/calendar",
    browserEnabled: false,
    nativeEnabled: false,
  });
}

export const GoogleSheetsSyncService = {
  async run(input: { jobLimit?: number; reconciliationLimit?: number } = {}) {
    const companyId = process.env.GOOGLE_SHEETS_REPORTING_COMPANY_ID?.trim();
    if (!companyId) {
      throw new Error("Google Sheets reporting company is not configured.");
    }
    const { reportingSpreadsheetId } = getGoogleIntegrationConfig();
    await ReportingSyncRepository.ensureDestination(
      companyId,
      reportingSpreadsheetId,
    );
    const result = await runReportingWorker(
      {
        ...ReportingSyncRepository,
        applyChanges: GoogleSheetsHolidayProjection.apply,
        reconcile: GoogleSheetsHolidayProjection.reconcile,
        alertFailure,
      },
      input,
    );
    console.info("[GoogleSheetsSyncService] Worker complete.", result);
    return result;
  },
};
