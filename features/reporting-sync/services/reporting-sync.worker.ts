import type {
  HolidayProjection,
  ReportingDestination,
  ReportingRunResult,
  ReportingSyncJob,
} from "@/features/reporting-sync/types/reporting-sync.types";

type ProjectionChange = {
  recordId: string;
  projection: HolidayProjection | null;
};

export type ReportingWorkerDependencies = {
  claimJobs(workerId: string, limit: number): Promise<ReportingSyncJob[]>;
  findProjection(
    eventId: string,
    companyId: string,
  ): Promise<HolidayProjection | null>;
  applyChanges(
    destination: ReportingDestination,
    changes: ProjectionChange[],
  ): Promise<{ writes: number; cleared: number }>;
  completeJob(outboxId: string, workerId: string): Promise<void>;
  failJob(
    outboxId: string,
    workerId: string,
    safeError: string,
  ): Promise<string>;
  listDueReconciliations(limit: number): Promise<ReportingDestination[]>;
  listProjections(companyId: string): Promise<HolidayProjection[]>;
  reconcile(
    destination: ReportingDestination,
    projections: HolidayProjection[],
  ): Promise<{
    sourceRowCount: number;
    destinationRowCount: number;
    driftCount: number;
  }>;
  completeReconciliation(
    destination: ReportingDestination,
    counts: {
      sourceRowCount: number;
      destinationRowCount: number;
      driftCount: number;
    },
  ): Promise<void>;
  failReconciliation(
    destination: ReportingDestination,
    safeError: string,
  ): Promise<void>;
  alertFailure(destination: ReportingDestination): Promise<void>;
};

function safeSyncError(error: unknown) {
  if (error instanceof Error && error.message === "sheets_schema_mismatch") {
    return "sheets_schema_mismatch";
  }
  if (
    error instanceof Error &&
    error.message === "google_authentication_failed"
  ) {
    return "google_authentication_failed";
  }
  return "sheets_sync_failed";
}

export async function runReportingWorker(
  dependencies: ReportingWorkerDependencies,
  input: { jobLimit?: number; reconciliationLimit?: number } = {},
): Promise<ReportingRunResult> {
  const workerId = crypto.randomUUID();
  const result: ReportingRunResult = {
    claimed: 0,
    synced: 0,
    failed: 0,
    terminalFailures: 0,
    reconciled: 0,
    driftRepaired: 0,
  };
  const jobs = await dependencies.claimJobs(workerId, input.jobLimit ?? 20);
  result.claimed = jobs.length;
  const groups = new Map<string, ReportingSyncJob[]>();

  for (const job of jobs) {
    groups.set(job.destinationId, [
      ...(groups.get(job.destinationId) ?? []),
      job,
    ]);
  }

  for (const groupedJobs of groups.values()) {
    const first = groupedJobs[0];
    const destination: ReportingDestination = {
      id: first.destinationId,
      companyId: first.companyId,
      spreadsheetId: first.spreadsheetId,
      sheetName: first.sheetName,
      alertedAt: null,
    };
    try {
      const changes = await Promise.all(
        groupedJobs.map(async (job) => ({
          recordId: job.eventId,
          projection: await dependencies.findProjection(
            job.eventId,
            job.companyId,
          ),
        })),
      );
      await dependencies.applyChanges(destination, changes);
      for (const job of groupedJobs) {
        await dependencies.completeJob(job.outboxId, workerId);
        result.synced += 1;
      }
    } catch (error) {
      const safeError = safeSyncError(error);
      let groupHasTerminalFailure = false;
      for (const job of groupedJobs) {
        const status = await dependencies.failJob(
          job.outboxId,
          workerId,
          safeError,
        );
        result.failed += 1;
        if (status === "failed") {
          result.terminalFailures += 1;
          groupHasTerminalFailure = true;
        }
      }
      if (groupHasTerminalFailure) await dependencies.alertFailure(destination);
    }
  }

  const destinations = await dependencies.listDueReconciliations(
    input.reconciliationLimit ?? 1,
  );
  for (const destination of destinations) {
    try {
      const projections = await dependencies.listProjections(
        destination.companyId,
      );
      const counts = await dependencies.reconcile(destination, projections);
      await dependencies.completeReconciliation(destination, counts);
      result.reconciled += 1;
      result.driftRepaired += counts.driftCount;
    } catch (error) {
      await dependencies.failReconciliation(destination, safeSyncError(error));
      await dependencies.alertFailure(destination);
    }
  }

  return result;
}
