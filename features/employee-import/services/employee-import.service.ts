import "server-only";

import { EmployeeImportRepository } from "@/features/employee-import/repositories/employee-import.repository";
import { EmployeeImportMapper } from "@/features/employee-import/services/employee-import.mapper";
import { EmployeeImportValidator } from "@/features/employee-import/services/employee-import.validator";
import type {
  EmployeeImportActionState,
  EmployeeImportFileMetadata,
  EmployeeImportFoundationData,
  EmployeeImportFoundationHooks,
  EmployeeImportPreparedFile,
  EmployeeImportTemplateColumn,
  EmployeeImportUploadValues,
  EmployeeImportValidationCatalog,
  EmployeeImportWizardStep,
} from "@/features/employee-import/types/employee-import.types";

const EMPLOYEE_IMPORT_TEMPLATE_COLUMNS: EmployeeImportTemplateColumn[] = [
  {
    key: "employee_id",
    label: "Employee ID",
    required: true,
    description: "Unique employee code used for sign-in and employee identity.",
    example: "EMP-1001",
  },
  {
    key: "name",
    label: "Full Name",
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
    key: "email",
    label: "Email",
    required: false,
    description: "Optional contact email for the employee profile.",
    example: "amina.rahman@example.com",
  },
  {
    key: "date_of_birth",
    label: "Date of Birth",
    required: true,
    description: "Use ISO format to keep future parsing predictable.",
    example: "1995-04-18",
  },
  {
    key: "joining_date",
    label: "Joining Date",
    required: true,
    description: "Employee start date in YYYY-MM-DD format.",
    example: "2025-01-15",
  },
  {
    key: "role_name",
    label: "Role Name",
    required: true,
    description: "Must match an active role already configured for the company.",
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
    key: "status",
    label: "Status",
    required: true,
    description: "Allowed values are active, inactive, or archived.",
    example: "active",
  },
];

const EMPLOYEE_IMPORT_WIZARD_STEPS: EmployeeImportWizardStep[] = [
  {
    key: "upload",
    label: "Upload",
    description: "Choose a CSV or Excel file from your device.",
  },
  {
    key: "parse",
    label: "Parse",
    description: "Prepare file rows for normalization and staged processing.",
  },
  {
    key: "normalize",
    label: "Normalize",
    description: "Standardize employee IDs, status values, and auth-ready fields.",
  },
  {
    key: "validate",
    label: "Validate",
    description: "Run duplicate, role, manager, phone, and date checks.",
  },
  {
    key: "preview",
    label: "Preview",
    description: "Show admins the exact rows that will succeed or fail.",
  },
  {
    key: "import",
    label: "Import",
    description: "Create auth users and employee records in safe batches later.",
  },
  {
    key: "summary",
    label: "Summary",
    description: "Report success, failures, and downloadable problem rows.",
  },
];

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildPreparedFile(file: EmployeeImportFileMetadata): EmployeeImportPreparedFile {
  const normalized = EmployeeImportMapper.normalizeFileMetadata(file);

  return {
    fileName: normalized.fileName,
    fileType: normalized.fileType,
    normalizedFileName: normalized.normalizedFileName,
    size: normalized.size,
    pipeline: EMPLOYEE_IMPORT_WIZARD_STEPS.map((step) => step.key),
    progressLabel: "Foundation ready. Parsing and execution will be enabled in later sprints.",
  };
}

async function buildValidationCatalog(
  companyId: string,
): Promise<EmployeeImportValidationCatalog> {
  const [roles, managers, employeeIds] = await Promise.all([
    EmployeeImportRepository.listRoleReferences(companyId),
    EmployeeImportRepository.listManagerReferences(companyId),
    EmployeeImportRepository.listEmployeeIds(companyId),
  ]);

  return {
    roleNames: roles.map((role) => role.name),
    managerEmployeeIds: managers.map((manager) => manager.employeeId.toUpperCase()),
    employeeIds: employeeIds.map((employeeId) => employeeId.toUpperCase()),
  };
}

function buildHooks(fileName: string): EmployeeImportFoundationHooks {
  return {
    activityLog: {
      module: "employee",
      action: "updated",
      entityType: "employee_import_jobs",
      entityId: null,
      description: `Prepared employee import foundation for ${fileName}`,
      metadata: {
        pipeline: EMPLOYEE_IMPORT_WIZARD_STEPS.map((step) => step.key),
      },
    },
    notification: {
      type: "system",
      title: "Employee import foundation ready",
      message:
        "The employee import foundation has been prepared for future validation and execution.",
      actionUrl: "/admin/users/import",
      createdBy: null,
    },
  };
}

export async function getEmployeeImportFoundationData(): Promise<EmployeeImportFoundationData> {
  const company = await EmployeeImportRepository.getActiveCompany();

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
    templateColumns: EMPLOYEE_IMPORT_TEMPLATE_COLUMNS,
    wizardSteps: EMPLOYEE_IMPORT_WIZARD_STEPS,
    recentJobs,
    maxUploadSizeBytes: EmployeeImportValidator.maxUploadSizeBytes,
  };
}

export async function prepareEmployeeImportFoundation(
  values: EmployeeImportUploadValues,
): Promise<EmployeeImportActionState> {
  const issues = EmployeeImportValidator.validateFoundationFile(values.file);

  if (issues.length > 0) {
    return {
      ok: false,
      message: "Fix the selected file before continuing.",
      issues,
    };
  }

  const company = await EmployeeImportRepository.getActiveCompany();

  if (!company) {
    return {
      ok: false,
      message: "Company was not found.",
      issues: [{ field: "company", message: "Company was not found." }],
    };
  }

  await buildValidationCatalog(company.id);
  const preparedFile = buildPreparedFile(values.file);
  void buildHooks(preparedFile.fileName);

  return {
    ok: true,
    message:
      "Foundation checks passed. Preview, row validation, and import execution will be enabled in upcoming sprints.",
    preparedFile: {
      ...preparedFile,
      progressLabel: preparedFile.progressLabel,
    },
    issues: [],
  };
}

export function buildEmployeeImportTemplateCsv() {
  const headers = EMPLOYEE_IMPORT_TEMPLATE_COLUMNS.map((column) => column.key);
  const sampleRow = EMPLOYEE_IMPORT_TEMPLATE_COLUMNS.map((column) => column.example);

  return [headers, sampleRow]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

export function getEmployeeImportHooks(fileName: string) {
  return buildHooks(fileName);
}

export const EmployeeImportService = {
  buildTemplateCsv: buildEmployeeImportTemplateCsv,
  getFoundationData: getEmployeeImportFoundationData,
  getHooks: getEmployeeImportHooks,
  prepareFoundation: prepareEmployeeImportFoundation,
  templateColumns: EMPLOYEE_IMPORT_TEMPLATE_COLUMNS,
  wizardSteps: EMPLOYEE_IMPORT_WIZARD_STEPS,
};
