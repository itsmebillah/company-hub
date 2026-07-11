import type {
  EmployeeImportFileMetadata,
  EmployeeImportFileType,
  EmployeeImportNormalizedRow,
  EmployeeImportRowDraft,
} from "@/features/employee-import/types/employee-import.types";

const INTERNAL_AUTH_EMAIL_DOMAIN = "companyhub.local";

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeEmployeeId(value: string) {
  return normalizeWhitespace(value).toUpperCase();
}

function normalizeOptional(value: string) {
  const nextValue = normalizeWhitespace(value);
  return nextValue.length > 0 ? nextValue : "";
}

function normalizeStatus(value: string) {
  return normalizeOptional(value).toLowerCase();
}

function getFileType(name: string): EmployeeImportFileType {
  const normalized = name.trim().toLowerCase();

  return normalized.endsWith(".xlsx") ? "xlsx" : "csv";
}

function buildInternalAuthEmail(employeeId: string) {
  return `${employeeId}@${INTERNAL_AUTH_EMAIL_DOMAIN}`;
}

function buildDefaultPassword(employeeId: string) {
  return employeeId;
}

export const EmployeeImportMapper = {
  normalizeFileMetadata(file: EmployeeImportFileMetadata) {
    const normalizedName = normalizeWhitespace(file.name);

    return {
      fileName: normalizedName,
      normalizedFileName: normalizedName.toLowerCase(),
      fileType: getFileType(normalizedName),
      size: file.size,
      mimeType: normalizeOptional(file.mimeType),
    };
  },

  normalizeRow(row: EmployeeImportRowDraft): EmployeeImportNormalizedRow {
    const employeeId = normalizeEmployeeId(row.employeeId);

    return {
      rowNumber: row.rowNumber,
      employeeId,
      name: normalizeWhitespace(row.name),
      phone: normalizeWhitespace(row.phone),
      email: normalizeOptional(row.email).toLowerCase(),
      dateOfBirth: normalizeOptional(row.dateOfBirth),
      joiningDate: normalizeOptional(row.joiningDate),
      photoUrl: normalizeOptional(row.photoUrl),
      roleName: normalizeWhitespace(row.roleName),
      managerEmployeeId: normalizeEmployeeId(row.managerEmployeeId),
      status: normalizeStatus(row.status),
      internalAuthEmail: buildInternalAuthEmail(employeeId),
      defaultPassword: buildDefaultPassword(employeeId),
    };
  },
};
