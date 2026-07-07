"use server";

import type {
  EmployeeImportActionState,
  EmployeeImportUploadValues,
} from "@/features/employee-import/types/employee-import.types";
import { EmployeeImportService } from "@/features/employee-import/services/employee-import.service";

export async function prepareEmployeeImportAction(
  values: EmployeeImportUploadValues,
): Promise<EmployeeImportActionState> {
  try {
    return await EmployeeImportService.prepareFoundation(values);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to prepare employee import foundation.",
      issues: [
        {
          field: "file",
          message: "Unable to prepare employee import foundation.",
        },
      ],
    };
  }
}
