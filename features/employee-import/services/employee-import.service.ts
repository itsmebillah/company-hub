import "server-only";

import { requireCurrentEmployeeContext } from "@/features/auth/services/current-employee-context.service";
import { toSupabaseEmployeePassword } from "@/features/auth/utils/employee-password";
import { logActivity } from "@/features/activity/utils/activity-log";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { EmployeeImportRepository } from "@/features/employee-import/repositories/employee-import.repository";
import { EmployeeImportValidator } from "@/features/employee-import/services/employee-import.validator";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import type {
  EmployeeImportActionState,
  EmployeeImportBatchRowResult,
  EmployeeImportExecutionState,
  EmployeeImportFailedRowExport,
  EmployeeImportFileType,
  EmployeeImportFoundationData,
  EmployeeImportFoundationHooks,
  EmployeeImportUploadValues,
  EmployeeImportValidationCatalog,
  EmployeeImportWizardStep,
} from "@/features/employee-import/types/employee-import.types";

const BATCH_SIZE = 50;
const INTERNAL_AUTH_EMAIL_DOMAIN = "companyhub.local";

const EMPLOYEE_IMPORT_TEMPLATE_COLUMNS = [
  {
    key: "employee_id",
    label: "Employee ID",
    required: true,
    description: "Unique employee code used for sign-in and employee identity.",
    example: "EMP-1001",
  },
  {
    key: "name",
    label: "Employee Name",
    required: true,
    description: "Employee full name as it should appear across the platform.",
    example: "Amina Rahman",
  },
  {
    key: "phone",
    label: "Phone",
    required: true,
    description: "Use a valid Bangladesh mobile number.",
    example: "01712345678",
  },
  {
    key: "role_name",
    label: "Role",
    required: true,
    description:
      "Must match an active role already configured for the company.",
    example: "SR",
  },
  {
    key: "manager_employee_id",
    label: "Manager Employee ID",
    required: false,
    description: "Required when the selected role needs a reporting manager.",
    example: "EMP-0901",
  },
  {
    key: "joining_date",
    label: "Joining Date",
    required: true,
    description: "Employee start date in YYYY-MM-DD format.",
    example: "2025-01-15",
  },
  {
    key: "status",
    label: "Status",
    required: true,
    description: "Allowed values are active, inactive, or archived.",
    example: "active",
  },
  {
    key: "work_mode",
    label: "Work Mode",
    required: false,
    description:
      "Allowed values are Office, Field, or Hybrid. Blank defaults to Office.",
    example: "Field",
  },
  {
    key: "email",
    label: "Email",
    required: false,
    description: "Optional contact email for the employee profile.",
    example: "amina.rahman@example.com",
  },
  {
    key: "date_of_birth",
    label: "Date of Birth",
    required: false,
    description: "Optional date of birth in YYYY-MM-DD format.",
    example: "1995-04-18",
  },
  {
    key: "photo_url",
    label: "Photo URL",
    required: false,
    description: "Optional image URL to store on the employee profile.",
    example: "https://example.com/photos/emp-1001.jpg",
  },
] as const;

const EMPLOYEE_IMPORT_WIZARD_STEPS: EmployeeImportWizardStep[] = [
  {
    key: "upload",
    label: "Upload",
    description: "Choose a CSV or Excel file from your device.",
  },
  {
    key: "parse",
    label: "Parse",
    description: "Read file rows from CSV or Excel into a common structure.",
  },
  {
    key: "normalize",
    label: "Normalize",
    description: "Standardize employee IDs, statuses, and auth-ready fields.",
  },
  {
    key: "validate",
    label: "Validate",
    description: "Run duplicate, role, manager, company, and date validation.",
  },
  {
    key: "preview",
    label: "Preview",
    description: "Show valid and invalid rows before import starts.",
  },
  {
    key: "import",
    label: "Import",
    description:
      "Create auth users and employee records in controlled batches.",
  },
  {
    key: "summary",
    label: "Summary",
    description: "Report imported, skipped, failed, and duplicate rows.",
  },
];

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function normalizeOptional(value: string) {
  const nextValue = value.trim();
  return nextValue.length > 0 ? nextValue : null;
}

function buildInternalAuthEmail(employeeId: string) {
  return `${employeeId}@${INTERNAL_AUTH_EMAIL_DOMAIN}`;
}

function buildHooks(fileName: string): EmployeeImportFoundationHooks {
  return {
    started: {
      module: "employee",
      action: "created",
      entityType: "employee_import_jobs",
      entityId: null,
      description: `Started employee import for ${fileName}`,
      metadata: {
        pipeline: EMPLOYEE_IMPORT_WIZARD_STEPS.map((step) => step.key),
      },
    },
    completed: {
      module: "employee",
      action: "updated",
      entityType: "employee_import_jobs",
      entityId: null,
      description: `Completed employee import for ${fileName}`,
      metadata: {
        pipeline: EMPLOYEE_IMPORT_WIZARD_STEPS.map((step) => step.key),
      },
    },
    failed: {
      module: "employee",
      action: "updated",
      entityType: "employee_import_jobs",
      entityId: null,
      description: `Failed employee import for ${fileName}`,
      metadata: {
        pipeline: EMPLOYEE_IMPORT_WIZARD_STEPS.map((step) => step.key),
      },
    },
    notification: {
      type: "system",
      title: "Employee import completed",
      message: `Employee import finished for ${fileName}.`,
      actionUrl: "/admin/users/import",
      createdBy: null,
    },
  };
}

async function buildValidationCatalog(
  companyId: string,
): Promise<EmployeeImportValidationCatalog> {
  const [roles, managers, employees] = await Promise.all([
    EmployeeImportRepository.listRoleReferences(companyId),
    EmployeeImportRepository.listManagerReferences(companyId),
    EmployeeImportRepository.listExistingEmployees(companyId),
  ]);

  return {
    roleByName: new Map(
      roles.map((role) => [role.name.toLowerCase(), role] as const),
    ),
    managerByEmployeeId: new Map(
      managers.map((manager) => [manager.employeeId.toUpperCase(), manager]),
    ),
    existingEmployeeIds: new Set(
      employees.map((employee) => employee.employee_id.toUpperCase()),
    ),
    existingPhones: new Set(
      employees
        .map((employee) => (employee.phone ?? "").trim())
        .filter(Boolean),
    ),
    existingInternalAuthEmails: new Set(
      employees
        .map((employee) =>
          (employee.internal_auth_email ?? "").trim().toLowerCase(),
        )
        .filter(Boolean),
    ),
  };
}

async function notifyImportCompletion(input: {
  companyId: string;
  createdBy: string | null;
  fileName: string;
  importedCount: number;
  failedCount: number;
}) {
  const hooks = buildHooks(input.fileName);
  await NotificationService.createForActiveCompanyEmployees({
    companyId: input.companyId,
    type: hooks.notification.type,
    title: hooks.notification.title,
    message: `${input.fileName}: ${input.importedCount} imported, ${input.failedCount} failed.`,
    actionUrl: hooks.notification.actionUrl,
    createdBy: input.createdBy,
  });
}

function toFailedReasonMessages(
  errors: Array<{ field?: string; message?: string }>,
) {
  return errors.map((issue) => ({
    field: issue.field ?? "import",
    message: issue.message ?? "Import failed.",
    severity: "error" as const,
  }));
}

async function rollbackCreatedAuthUsers(userIds: string[]) {
  if (userIds.length === 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();

  for (const userId of userIds) {
    await supabase.auth.admin.deleteUser(userId);
  }
}

function buildTemplateColumns() {
  return EMPLOYEE_IMPORT_TEMPLATE_COLUMNS.map((column) => ({
    key: column.key,
    label: column.label,
    required: column.required,
    description: column.description,
    example: column.example,
  }));
}

export async function getEmployeeImportFoundationData(): Promise<EmployeeImportFoundationData> {
  const actor = await requireCurrentEmployeeContext();
  const company = await EmployeeImportRepository.getCompanyById(
    actor.companyId,
  );

  if (!company) {
    throw new Error("Company was not found.");
  }

  const [employeeCount, roles, managers, recentJobs] = await Promise.all([
    EmployeeImportRepository.getEmployeeCount(company.id),
    EmployeeImportRepository.listRoleReferences(company.id),
    EmployeeImportRepository.listManagerReferences(company.id),
    EmployeeImportRepository.listRecentJobs(company.id),
  ]);

  return {
    companyName: company.name,
    employeeCount,
    roleCount: roles.length,
    managerCount: managers.length,
    supportedFormats: ["CSV", "Excel (.xlsx)"],
    templateColumns: buildTemplateColumns(),
    wizardSteps: EMPLOYEE_IMPORT_WIZARD_STEPS,
    recentJobs,
    maxUploadSizeBytes: EmployeeImportValidator.maxUploadSizeBytes,
  };
}

export function buildEmployeeImportTemplateCsv() {
  const headers = EMPLOYEE_IMPORT_TEMPLATE_COLUMNS.map((column) => column.key);
  const sampleRow = EMPLOYEE_IMPORT_TEMPLATE_COLUMNS.map(
    (column) => column.example,
  );

  return [headers, sampleRow]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

export async function previewEmployeeImport(
  values: EmployeeImportUploadValues,
): Promise<EmployeeImportActionState> {
  const fileIssues = EmployeeImportValidator.validateFoundationFile(
    values.file,
  );

  if (fileIssues.length > 0) {
    return {
      ok: false,
      message: "Fix the selected file before continuing.",
      issues: fileIssues,
    };
  }

  if (values.rows.length === 0) {
    return {
      ok: false,
      message: "The selected file does not contain any employee rows.",
      issues: [
        {
          field: "file",
          message: "The selected file does not contain any employee rows.",
        },
      ],
    };
  }

  const actor = await requireCurrentEmployeeContext();
  const catalog = await buildValidationCatalog(actor.companyId);
  const previewRows = EmployeeImportValidator.buildPreviewRows(
    values.rows,
    catalog,
  );
  const summary = {
    totalRows: previewRows.length,
    validRows: previewRows.filter((row) => row.status === "valid").length,
    invalidRows: previewRows.filter((row) => row.status === "invalid").length,
    duplicateRows: previewRows.filter((row) => row.duplicateFields.length > 0)
      .length,
  };
  const fileType: EmployeeImportFileType = values.file.name
    .trim()
    .toLowerCase()
    .endsWith(".xlsx")
    ? "xlsx"
    : "csv";
  const jobId = await EmployeeImportRepository.createPreviewJob({
    companyId: actor.companyId,
    createdBy: actor.id,
    fileName: values.file.name.trim(),
    fileType,
    totalRows: summary.totalRows,
    validRows: summary.validRows,
    invalidRows: summary.invalidRows,
    duplicateRows: summary.duplicateRows,
  });

  await EmployeeImportRepository.replacePreviewRows(jobId, previewRows);

  return {
    ok: true,
    preview: {
      jobId,
      fileName: values.file.name.trim(),
      fileType,
      rows: previewRows,
      summary,
      pipeline: EMPLOYEE_IMPORT_WIZARD_STEPS.map((step) => step.key),
    },
  };
}

export async function processEmployeeImportBatch(
  jobId: string,
): Promise<EmployeeImportExecutionState> {
  const actor = await requireCurrentEmployeeContext();
  const job = await EmployeeImportRepository.getJobContext(jobId);

  if (!job || job.companyId !== actor.companyId) {
    return {
      ok: false,
      message: "Import job was not found.",
    };
  }

  if (job.status === "completed") {
    return {
      ok: true,
      jobId,
      status: "completed",
      importedCount: job.successfulRows,
      failedCount: job.failedRows,
      remainingCount: 0,
      skippedCount: job.invalidRows,
      duplicateCount: Number(job.metadata.duplicateRows ?? 0),
      totalRows: job.totalRows,
      completed: true,
      rows: [],
    };
  }

  if (job.status !== "processing") {
    await EmployeeImportRepository.markJobProcessing(jobId);
    await logActivity({
      companyId: actor.companyId,
      module: "employee",
      action: "created",
      entityType: "employee_import_jobs",
      entityId: jobId,
      description: `Import started for ${job.sourceFileName}`,
      metadata: {
        totalRows: job.totalRows,
        validRows: job.validRows,
        invalidRows: job.invalidRows,
      },
    });
  }

  const pendingRows = await EmployeeImportRepository.getNextPendingValidRows(
    jobId,
    BATCH_SIZE,
  );

  if (pendingRows.length === 0) {
    const failedRows = await EmployeeImportRepository.getFailedRows(jobId);
    const importedCount = job.successfulRows;
    const failedCount = job.failedRows;
    await EmployeeImportRepository.updateJobProgress({
      jobId,
      processedRows: importedCount + failedCount,
      successfulRows: importedCount,
      failedRows: failedCount,
      status: failedCount > 0 ? "failed" : "completed",
    });
    await logActivity({
      companyId: actor.companyId,
      module: "employee",
      action: failedCount > 0 ? "updated" : "updated",
      entityType: "employee_import_jobs",
      entityId: jobId,
      description:
        failedCount > 0
          ? `Import failed with ${failedCount} failed row(s) for ${job.sourceFileName}`
          : `Import completed for ${job.sourceFileName}`,
      metadata: {
        importedCount,
        failedCount,
      },
    });
    await notifyImportCompletion({
      companyId: actor.companyId,
      createdBy: actor.id,
      fileName: job.sourceFileName,
      importedCount,
      failedCount,
    });

    return {
      ok: true,
      jobId,
      status: failedCount > 0 ? "failed" : "completed",
      importedCount,
      failedCount,
      remainingCount: 0,
      skippedCount: job.invalidRows,
      duplicateCount: Number(job.metadata.duplicateRows ?? 0),
      totalRows: job.totalRows,
      completed: true,
      rows: failedRows.map((row) => ({
        rowNumber: row.rowNumber,
        employeeId: row.employeeId,
        name: row.employeeName,
        status: "failed",
        reason: row.reason,
      })),
    };
  }

  const roleCatalog = await EmployeeImportRepository.listRoleReferences(
    actor.companyId,
  );
  const managerCatalog = await EmployeeImportRepository.listManagerReferences(
    actor.companyId,
  );
  const roleByName = new Map(
    roleCatalog.map((role) => [role.name.toLowerCase(), role]),
  );
  const managerByEmployeeId = new Map(
    managerCatalog.map(
      (manager) => [manager.employeeId.toUpperCase(), manager] as const,
    ),
  );
  const rowResults: EmployeeImportBatchRowResult[] = [];
  const createdAuthUserIds: string[] = [];
  const employeeRows: Database["public"]["Tables"]["employees"]["Insert"][] =
    [];
  const pendingContext = pendingRows.map((row) => {
    const normalized =
      row.normalized_data &&
      typeof row.normalized_data === "object" &&
      !Array.isArray(row.normalized_data)
        ? (row.normalized_data as Record<string, unknown>)
        : {};

    return {
      id: row.id,
      rowNumber: row.row_number,
      normalized,
    };
  });
  const supabase = createSupabaseAdminClient();

  try {
    for (const row of pendingContext) {
      const employeeId = String(row.normalized.employeeId ?? "").toUpperCase();
      const roleName = String(row.normalized.roleName ?? "");
      const role = roleByName.get(roleName.toLowerCase());

      if (!role) {
        rowResults.push({
          rowNumber: row.rowNumber,
          employeeId,
          name: String(row.normalized.name ?? ""),
          status: "failed",
          reason: "Role could not be resolved during import.",
        });
        continue;
      }

      let managerId: string | null = null;
      const managerEmployeeId = String(
        row.normalized.managerEmployeeId ?? "",
      ).toUpperCase();

      if (managerEmployeeId) {
        const manager = managerByEmployeeId.get(managerEmployeeId);

        if (!manager) {
          rowResults.push({
            rowNumber: row.rowNumber,
            employeeId,
            name: String(row.normalized.name ?? ""),
            status: "failed",
            reason: "Manager could not be resolved during import.",
          });
          continue;
        }

        managerId = manager.id;
      }

      const internalAuthEmail = buildInternalAuthEmail(employeeId);
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: internalAuthEmail,
          password: toSupabaseEmployeePassword(employeeId),
          email_confirm: true,
          user_metadata: {
            employee_id: employeeId,
            company_id: actor.companyId,
          },
        });

      if (authError || !authData.user) {
        rowResults.push({
          rowNumber: row.rowNumber,
          employeeId,
          name: String(row.normalized.name ?? ""),
          status: "failed",
          reason: authError?.message || "Unable to create auth user.",
        });
        continue;
      }

      createdAuthUserIds.push(authData.user.id);
      employeeRows.push({
        employee_id: employeeId,
        name: String(row.normalized.name ?? ""),
        phone: normalizeOptional(String(row.normalized.phone ?? "")),
        email: normalizeOptional(String(row.normalized.email ?? "")),
        photo_url: normalizeOptional(String(row.normalized.photoUrl ?? "")),
        date_of_birth: normalizeOptional(
          String(row.normalized.dateOfBirth ?? ""),
        ),
        joining_date: String(row.normalized.joiningDate ?? ""),
        company_id: actor.companyId,
        role_id: role.id,
        manager_id: managerId,
        work_mode: String(
          row.normalized.workMode ?? "office",
        ) as Database["public"]["Enums"]["employee_work_mode"],
        auth_user_id: authData.user.id,
        internal_auth_email: internalAuthEmail,
        status: String(
          row.normalized.status ?? "active",
        ) as Database["public"]["Enums"]["record_status"],
      });
      rowResults.push({
        rowNumber: row.rowNumber,
        employeeId,
        name: String(row.normalized.name ?? ""),
        status: "imported",
        reason: "Imported successfully.",
      });
    }

    const successfulCandidates = rowResults.filter(
      (row) => row.status === "imported",
    );

    if (employeeRows.length > 0) {
      try {
        await EmployeeImportRepository.insertEmployees(employeeRows);
      } catch (error) {
        await rollbackCreatedAuthUsers(createdAuthUserIds);

        const rollbackReason =
          error instanceof Error
            ? error.message
            : "Unable to create imported employees.";
        const failedRows = rowResults.map((row) => ({
          ...row,
          status: "failed" as const,
          reason: rollbackReason,
        }));

        await EmployeeImportRepository.updateRowResults(
          pendingContext.map((row) => ({
            id: row.id,
            status: "failed",
            validationErrors: toFailedReasonMessages([
              { field: "import", message: rollbackReason },
            ]),
          })),
        );

        const failedCount = job.failedRows + pendingContext.length;
        const processedRows = job.processedRows + pendingContext.length;
        await EmployeeImportRepository.updateJobProgress({
          jobId,
          processedRows,
          successfulRows: job.successfulRows,
          failedRows: failedCount,
          status: "processing",
        });

        return {
          ok: true,
          jobId,
          status: "processing",
          importedCount: job.successfulRows,
          failedCount,
          remainingCount: Math.max(job.validRows - processedRows, 0),
          skippedCount: job.invalidRows,
          duplicateCount: Number(job.metadata.duplicateRows ?? 0),
          totalRows: job.totalRows,
          completed: false,
          rows: failedRows,
        };
      }
    }

    const rowStatusUpdates = pendingContext.map((row) => {
      const rowResult = rowResults.find(
        (item) => item.rowNumber === row.rowNumber,
      );
      const isImported = rowResult?.status === "imported";

      return {
        id: row.id,
        status: isImported ? ("processed" as const) : ("failed" as const),
        validationErrors: isImported
          ? []
          : toFailedReasonMessages([
              {
                field: "import",
                message: rowResult?.reason ?? "Import failed.",
              },
            ]),
      };
    });

    await EmployeeImportRepository.updateRowResults(rowStatusUpdates);

    const importedInBatch = successfulCandidates.length;
    const failedInBatch = pendingContext.length - importedInBatch;
    const importedCount = job.successfulRows + importedInBatch;
    const failedCount = job.failedRows + failedInBatch;
    const processedRows = job.processedRows + pendingContext.length;

    await EmployeeImportRepository.updateJobProgress({
      jobId,
      processedRows,
      successfulRows: importedCount,
      failedRows: failedCount,
      status: "processing",
    });

    return {
      ok: true,
      jobId,
      status: "processing",
      importedCount,
      failedCount,
      remainingCount: Math.max(job.validRows - processedRows, 0),
      skippedCount: job.invalidRows,
      duplicateCount: Number(job.metadata.duplicateRows ?? 0),
      totalRows: job.totalRows,
      completed: false,
      rows: rowResults,
    };
  } catch (error) {
    await rollbackCreatedAuthUsers(createdAuthUserIds);
    await EmployeeImportRepository.updateRowResults(
      pendingContext.map((row) => ({
        id: row.id,
        status: "failed",
        validationErrors: toFailedReasonMessages([
          {
            field: "import",
            message:
              error instanceof Error
                ? error.message
                : "Import batch failed unexpectedly.",
          },
        ]),
      })),
    );

    const failedCount = job.failedRows + pendingContext.length;
    const processedRows = job.processedRows + pendingContext.length;
    await EmployeeImportRepository.updateJobProgress({
      jobId,
      processedRows,
      successfulRows: job.successfulRows,
      failedRows: failedCount,
      status: "processing",
    });

    return {
      ok: true,
      jobId,
      status: "processing",
      importedCount: job.successfulRows,
      failedCount,
      remainingCount: Math.max(job.validRows - processedRows, 0),
      skippedCount: job.invalidRows,
      duplicateCount: Number(job.metadata.duplicateRows ?? 0),
      totalRows: job.totalRows,
      completed: false,
      rows: pendingContext.map((row) => ({
        rowNumber: row.rowNumber,
        employeeId: String(row.normalized.employeeId ?? ""),
        name: String(row.normalized.name ?? ""),
        status: "failed",
        reason:
          error instanceof Error
            ? error.message
            : "Import batch failed unexpectedly.",
      })),
    };
  }
}

export async function getEmployeeImportFailedRows(
  jobId: string,
): Promise<EmployeeImportFailedRowExport[]> {
  const actor = await requireCurrentEmployeeContext();
  const job = await EmployeeImportRepository.getJobContext(jobId);

  if (!job || job.companyId !== actor.companyId) {
    throw new Error("Import job was not found.");
  }

  return EmployeeImportRepository.getFailedRows(jobId);
}

export function getEmployeeImportHooks(fileName: string) {
  return buildHooks(fileName);
}

export const EmployeeImportService = {
  batchSize: BATCH_SIZE,
  buildTemplateCsv: buildEmployeeImportTemplateCsv,
  getFailedRows: getEmployeeImportFailedRows,
  getFoundationData: getEmployeeImportFoundationData,
  getHooks: getEmployeeImportHooks,
  preview: previewEmployeeImport,
  processBatch: processEmployeeImportBatch,
  templateColumns: buildTemplateColumns(),
  wizardSteps: EMPLOYEE_IMPORT_WIZARD_STEPS,
};
