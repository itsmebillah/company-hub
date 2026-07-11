import { getAllowedManagerRole } from "@/features/employees/constants/employee-rules";
import { EmployeeImportMapper } from "@/features/employee-import/services/employee-import.mapper";
import type {
  EmployeeImportFileMetadata,
  EmployeeImportPreviewIssue,
  EmployeeImportPreviewRow,
  EmployeeImportRowDraft,
  EmployeeImportValidationCatalog,
  EmployeeImportValidationIssue,
} from "@/features/employee-import/types/employee-import.types";

const SUPPORTED_EXTENSIONS = [".csv", ".xlsx"] as const;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const BANGLADESH_PHONE_PATTERN = /^(?:\+8801|8801|01)[3-9]\d{8}$/;
const VALID_STATUSES = new Set(["active", "inactive", "archived"]);

function hasSupportedExtension(name: string) {
  const normalized = name.trim().toLowerCase();
  return SUPPORTED_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function toIssue(field: string, message: string): EmployeeImportPreviewIssue {
  return { field, message, severity: "error" };
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
        message: "The selected file exceeds the 10 MB upload limit.",
      });
    }

    return issues;
  },

  buildPreviewRows(
    rows: EmployeeImportRowDraft[],
    catalog: EmployeeImportValidationCatalog,
  ): EmployeeImportPreviewRow[] {
    const employeeIdCounts = new Map<string, number>();
    const phoneCounts = new Map<string, number>();
    const internalAuthEmailCounts = new Map<string, number>();

    const normalizedRows = rows.map((row) => {
      const normalized = EmployeeImportMapper.normalizeRow(row);

      if (normalized.employeeId) {
        employeeIdCounts.set(
          normalized.employeeId,
          (employeeIdCounts.get(normalized.employeeId) ?? 0) + 1,
        );
      }

      if (normalized.phone) {
        phoneCounts.set(
          normalized.phone,
          (phoneCounts.get(normalized.phone) ?? 0) + 1,
        );
      }

      if (normalized.internalAuthEmail) {
        internalAuthEmailCounts.set(
          normalized.internalAuthEmail,
          (internalAuthEmailCounts.get(normalized.internalAuthEmail) ?? 0) + 1,
        );
      }

      return {
        raw: row,
        normalized,
      };
    });

    return normalizedRows.map(({ raw, normalized }) => {
      const issues: EmployeeImportPreviewIssue[] = [];
      const duplicateFields: string[] = [];
      const role = catalog.roleByName.get(normalized.roleName.toLowerCase());
      const manager = normalized.managerEmployeeId
        ? catalog.managerByEmployeeId.get(normalized.managerEmployeeId)
        : null;

      if (!normalized.employeeId) {
        issues.push(toIssue("employeeId", "Employee ID is required."));
      } else {
        if (employeeIdCounts.get(normalized.employeeId)! > 1) {
          issues.push(
            toIssue("employeeId", "Employee ID is duplicated inside the file."),
          );
          duplicateFields.push("employeeId");
        }

        if (catalog.existingEmployeeIds.has(normalized.employeeId)) {
          issues.push(
            toIssue("employeeId", "Employee ID already exists in this company."),
          );
          duplicateFields.push("employeeId");
        }
      }

      if (!normalized.name) {
        issues.push(toIssue("name", "Employee name is required."));
      }

      if (!normalized.phone) {
        issues.push(toIssue("phone", "Phone is required."));
      } else {
        if (!BANGLADESH_PHONE_PATTERN.test(normalized.phone)) {
          issues.push(
            toIssue("phone", "Phone must be a valid Bangladesh mobile number."),
          );
        }

        if (phoneCounts.get(normalized.phone)! > 1) {
          issues.push(toIssue("phone", "Phone number is duplicated inside the file."));
          duplicateFields.push("phone");
        }

        if (catalog.existingPhones.has(normalized.phone)) {
          issues.push(toIssue("phone", "Phone number already exists in this company."));
          duplicateFields.push("phone");
        }
      }

      if (!normalized.roleName) {
        issues.push(toIssue("roleName", "Role is required."));
      } else if (!role) {
        issues.push(toIssue("roleName", "Role must already exist in this company."));
      }

      if (!normalized.joiningDate) {
        issues.push(toIssue("joiningDate", "Joining date is required."));
      } else if (!isIsoDate(normalized.joiningDate)) {
        issues.push(
          toIssue("joiningDate", "Joining date must use YYYY-MM-DD format."),
        );
      }

      if (normalized.dateOfBirth && !isIsoDate(normalized.dateOfBirth)) {
        issues.push(
          toIssue("dateOfBirth", "Date of birth must use YYYY-MM-DD format."),
        );
      }

      if (!normalized.status) {
        issues.push(toIssue("status", "Status is required."));
      } else if (!VALID_STATUSES.has(normalized.status)) {
        issues.push(toIssue("status", "Status must be active, inactive, or archived."));
      }

      if (normalized.email && !isEmailValid(normalized.email)) {
        issues.push(toIssue("email", "Email is invalid."));
      }

      if (normalized.internalAuthEmail) {
        if (internalAuthEmailCounts.get(normalized.internalAuthEmail)! > 1) {
          issues.push(
            toIssue(
              "employeeId",
              "Internal auth email would be duplicated inside the file.",
            ),
          );
          duplicateFields.push("employeeId");
        }

        if (catalog.existingInternalAuthEmails.has(normalized.internalAuthEmail)) {
          issues.push(
            toIssue(
              "employeeId",
              "Internal auth email already exists in this company.",
            ),
          );
          duplicateFields.push("employeeId");
        }
      }

      if (role) {
        const expectedManagerRole = getAllowedManagerRole(role.name);

        if (expectedManagerRole === null && normalized.managerEmployeeId) {
          issues.push(
            toIssue(
              "managerEmployeeId",
              `${role.name} cannot report to another employee.`,
            ),
          );
        }

        if (expectedManagerRole && !normalized.managerEmployeeId) {
          issues.push(
            toIssue(
              "managerEmployeeId",
              `${role.name} must report to ${expectedManagerRole}.`,
            ),
          );
        }

        if (normalized.managerEmployeeId) {
          if (!manager) {
            issues.push(
              toIssue(
                "managerEmployeeId",
                "Manager must already exist as an active employee in this company.",
              ),
            );
          } else if (expectedManagerRole && manager.roleName !== expectedManagerRole) {
            issues.push(
              toIssue(
                "managerEmployeeId",
                `${role.name} must report to ${expectedManagerRole}.`,
              ),
            );
          }
        }
      }

      return {
        rowNumber: raw.rowNumber,
        raw,
        normalized,
        issues,
        duplicateFields: Array.from(new Set(duplicateFields)),
        status: issues.length === 0 ? "valid" : "invalid",
      };
    });
  },
};
