"use server";

import {
  getEmployeeImportFailedRows,
  previewEmployeeImport,
  processEmployeeImportBatch,
} from "@/features/employee-import/services/employee-import.service";
import { requireAdmin } from "@/features/auth/services/authorization.service";
import type {
  EmployeeImportActionState,
  EmployeeImportExecutionState,
  EmployeeImportFailedRowExport,
  EmployeeImportUploadValues,
} from "@/features/employee-import/types/employee-import.types";

export async function previewEmployeeImportAction(
  values: EmployeeImportUploadValues,
): Promise<EmployeeImportActionState> {
  try {
    await requireAdmin();
    return await previewEmployeeImport(values);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to prepare employee import preview.",
      issues: [
        {
          field: "file",
          message: "Unable to prepare employee import preview.",
        },
      ],
    };
  }
}

export async function processEmployeeImportBatchAction(
  jobId: string,
): Promise<EmployeeImportExecutionState> {
  try {
    await requireAdmin();
    return await processEmployeeImportBatch(jobId);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to process employee import batch.",
    };
  }
}

export async function getEmployeeImportFailedRowsAction(
  jobId: string,
): Promise<EmployeeImportFailedRowExport[]> {
  await requireAdmin();
  return getEmployeeImportFailedRows(jobId);
}
