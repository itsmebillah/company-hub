import type {
  EmployeeImportFileMetadata,
  EmployeeImportRowDraft,
  EmployeeImportValidationCatalog,
  EmployeeImportValidationIssue,
} from "@/features/employee-import/types/employee-import.types";
import { EmployeeImportMapper } from "@/features/employee-import/services/employee-import.mapper";

const SUPPORTED_EXTENSIONS = [".csv", ".xlsx"] as const;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const BANGLADESH_PHONE_PATTERN = /^(?:\+8801|8801|01)[3-9]\d{8}$/;

function hasSupportedExtension(name: string) {
  const normalized = name.trim().toLowerCase();
  return SUPPORTED_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export const EmployeeImportValidator = {
  maxUploadSizeBytes: MAX_UPLOAD_SIZE_BYTES,
  supportedExtensions: SUPPORTED_EXTENSIONS,

  validateFoundationFile(file: EmployeeImportFileMetadata): EmployeeImportValidationIssue[] {
    const issues: EmployeeImportValidationIssue[] = [];

    if (!file.name.trim()) {
      issues.push({ field: "file", message: "Choose a CSV or Excel file to continue." });
    }

    if (!hasSupportedExtension(file.name)) {
      issues.push({
        field: "file",
        message: "Only CSV and Excel (.xlsx) files are supported.",
      });
    }

    if (!Number.isFinite(file.size) || file.size <= 0) {
      issues.push({ field: "file", message: "The selected file appears to be empty." });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      issues.push({
        field: "file",
        message: "The selected file exceeds the 10 MB foundation limit.",
      });
    }

    return issues;
  },

  validateRowDraft(
    row: EmployeeImportRowDraft,
    catalog: EmployeeImportValidationCatalog,
  ): EmployeeImportValidationIssue[] {
    const normalized = EmployeeImportMapper.normalizeRow(row);
    const issues: EmployeeImportValidationIssue[] = [];

    if (!normalized.employeeId) {
      issues.push({ field: "employee_id", message: "Employee ID is required." });
    }

    if (
      normalized.employeeId &&
      catalog.employeeIds.includes(normalized.employeeId)
    ) {
      issues.push({
        field: "employee_id",
        message: "Employee ID already exists in the company.",
      });
    }

    if (!normalized.phone) {
      issues.push({ field: "phone", message: "Phone is required." });
    } else if (!BANGLADESH_PHONE_PATTERN.test(normalized.phone)) {
      issues.push({
        field: "phone",
        message: "Phone must be a valid Bangladesh mobile number.",
      });
    }

    if (!normalized.roleName) {
      issues.push({ field: "role_name", message: "Role is required." });
    } else if (!catalog.roleNames.includes(normalized.roleName)) {
      issues.push({ field: "role_name", message: "Role must already exist." });
    }

    if (
      normalized.managerEmployeeId &&
      !catalog.managerEmployeeIds.includes(normalized.managerEmployeeId)
    ) {
      issues.push({
        field: "manager_employee_id",
        message: "Manager must already exist as an active employee.",
      });
    }

    if (!normalized.joiningDate) {
      issues.push({
        field: "joining_date",
        message: "Joining date is required.",
      });
    } else if (!isIsoDate(normalized.joiningDate)) {
      issues.push({
        field: "joining_date",
        message: "Joining date must use YYYY-MM-DD format.",
      });
    }

    return issues;
  },
};
