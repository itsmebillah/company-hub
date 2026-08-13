import assert from "node:assert/strict";
import test from "node:test";

import {
  indexSheetRows,
  rowsEqual,
} from "../../features/reporting-sync/services/holiday-reporting-projection";
import {
  runReportingWorker,
  type ReportingWorkerDependencies,
} from "../../features/reporting-sync/services/reporting-sync.worker";
import type {
  HolidayProjection,
  ReportingDestination,
  ReportingSyncJob,
} from "../../features/reporting-sync/types/reporting-sync.types";

const projection: HolidayProjection = {
  recordId: "event-1",
  calendarName: "Bangladesh",
  calendarStatus: "active",
  holidayDate: "2026-08-13",
  title: "Verification holiday",
  holidayType: "company_holiday",
  isWorkingDay: false,
  description: "",
  eventStatus: "active",
  sourceUpdatedAt: "2026-08-13T00:00:00.000Z",
};

function job(overrides: Partial<ReportingSyncJob> = {}): ReportingSyncJob {
  return {
    outboxId: "outbox-1",
    eventId: "event-1",
    companyId: "company-1",
    destinationId: "destination-1",
    spreadsheetId: "spreadsheet-1",
    sheetName: "Holidays",
    attemptCount: 0,
    ...overrides,
  };
}

function destination(
  overrides: Partial<ReportingDestination> = {},
): ReportingDestination {
  return {
    id: "destination-1",
    companyId: "company-1",
    spreadsheetId: "spreadsheet-1",
    sheetName: "Holidays",
    alertedAt: null,
    ...overrides,
  };
}

function dependencies(overrides: Partial<ReportingWorkerDependencies> = {}) {
  const completed: string[] = [];
  const failures: string[] = [];
  const alerts: string[] = [];
  const applied = new Map<string, HolidayProjection | null>();
  const defaults: ReportingWorkerDependencies = {
    claimJobs: async () => [job()],
    findProjection: async () => projection,
    applyChanges: async (_destination, changes) => {
      changes.forEach((change) =>
        applied.set(change.recordId, change.projection),
      );
      return { writes: changes.length, cleared: 0 };
    },
    completeJob: async (outboxId) => {
      completed.push(outboxId);
    },
    failJob: async (_outboxId, _workerId, safeError) => {
      failures.push(safeError);
      return "pending";
    },
    listDueReconciliations: async () => [],
    listProjections: async () => [],
    reconcile: async () => ({
      sourceRowCount: 0,
      destinationRowCount: 0,
      driftCount: 0,
    }),
    completeReconciliation: async () => undefined,
    failReconciliation: async () => undefined,
    alertFailure: async (target) => {
      alerts.push(target.id);
    },
  };
  return {
    value: { ...defaults, ...overrides },
    completed,
    failures,
    alerts,
    applied,
  };
}

test("successfully completes a durable sync job", async () => {
  const fake = dependencies();
  const result = await runReportingWorker(fake.value, {
    reconciliationLimit: 0,
  });
  assert.equal(result.synced, 1);
  assert.deepEqual(fake.completed, ["outbox-1"]);
  assert.equal(fake.applied.get("event-1")?.title, "Verification holiday");
});

test("retries transient failures and only alerts after terminal failure", async () => {
  let terminal = false;
  const fake = dependencies({
    applyChanges: async () => {
      throw new Error("google_authentication_failed");
    },
    failJob: async (_outboxId, _workerId, safeError) => {
      fake.failures.push(safeError);
      return terminal ? "failed" : "pending";
    },
  });

  await runReportingWorker(fake.value, { reconciliationLimit: 0 });
  assert.deepEqual(fake.failures, ["google_authentication_failed"]);
  assert.equal(fake.alerts.length, 0);

  terminal = true;
  const result = await runReportingWorker(fake.value, {
    reconciliationLimit: 0,
  });
  assert.equal(result.terminalFailures, 1);
  assert.deepEqual(fake.alerts, ["destination-1"]);
});

test("replayed and expired-lease jobs remain idempotent by source record", async () => {
  const fake = dependencies({
    claimJobs: async () => [
      job(),
      job({ outboxId: "outbox-2", attemptCount: 1 }),
    ],
  });
  const result = await runReportingWorker(fake.value, {
    reconciliationLimit: 0,
  });
  assert.equal(result.synced, 2);
  assert.equal(fake.applied.size, 1);
  assert.deepEqual(fake.completed.sort(), ["outbox-1", "outbox-2"]);
});

test("keeps tenant destinations isolated while batching", async () => {
  const destinations: string[] = [];
  const fake = dependencies({
    claimJobs: async () => [
      job(),
      job({
        outboxId: "outbox-2",
        eventId: "event-2",
        companyId: "company-2",
        destinationId: "destination-2",
        spreadsheetId: "spreadsheet-2",
      }),
    ],
    findProjection: async (eventId, companyId) => ({
      ...projection,
      recordId: eventId,
      title: companyId,
    }),
    applyChanges: async (target, changes) => {
      destinations.push(
        `${target.companyId}:${target.spreadsheetId}:${changes[0].projection?.title}`,
      );
      return { writes: 1, cleared: 0 };
    },
  });
  await runReportingWorker(fake.value, { reconciliationLimit: 0 });
  assert.deepEqual(destinations.sort(), [
    "company-1:spreadsheet-1:company-1",
    "company-2:spreadsheet-2:company-2",
  ]);
});

test("reconciliation records repaired drift", async () => {
  let completedCounts: { driftCount: number } | undefined;
  const fake = dependencies({
    claimJobs: async () => [],
    listDueReconciliations: async () => [destination()],
    listProjections: async () => [projection],
    reconcile: async () => ({
      sourceRowCount: 1,
      destinationRowCount: 1,
      driftCount: 2,
    }),
    completeReconciliation: async (_target, counts) => {
      completedCounts = counts;
    },
  });
  const result = await runReportingWorker(fake.value);
  assert.equal(result.reconciled, 1);
  assert.equal(result.driftRepaired, 2);
  assert.equal(completedCounts?.driftCount, 2);
});

test("row indexing exposes duplicates and normalizes Sheets booleans", () => {
  assert.deepEqual(
    indexSheetRows([["event-1"], ["event-1"], ["event-2"]]).get("event-1"),
    [2, 3],
  );
  assert.equal(rowsEqual([true], ["TRUE"]), true);
});
