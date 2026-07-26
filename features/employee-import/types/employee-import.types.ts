import type { CreateNotificationInput } from "@/features/notifications/types/notification.types";
import type { Database } from "@/lib/supabase/types";

export type EmployeeImportJobStatus =
  Database["public"]["Enums"]["employee_import_status"];
export type EmployeeImportRowStatus =
  Database["public"]["Enums"]["employee_import_row_status"];
export type EmployeeImportFileType =
  Database["public"]["Enums"]["employee_import_file_type"];
export type EmployeeRecordStatus = Database["public"]["Enums"]["record_status"];
export type EmployeeWorkMode =
  Database["public"]["Enums"]["employee_work_mode"];

export type EmployeeImportTemplateColumn = {
  key: string;
  label: string;
  required: boolean;
  description: string;
  example: string;
};

export type EmployeeImportFileMetadata = {
  name: string;
  size: number;
  mimeType: string;
  lastModified?: number;
};

export type EmployeeImportValidationIssue = {
  field: string;
  message: string;
};

export type EmployeeImportUploadValues = {
  file: EmployeeImportFileMetadata;
  rows: EmployeeImportRowDraft[];
};

export type EmployeeImportPipelineStage =
  | "upload"
  | "parse"
  | "normalize"
  | "validate"
  | "preview"
  | "import"
  | "summary";

export type EmployeeImportWizardStep = {
  key: EmployeeImportPipelineStage;
  label: string;
  description: string;
};

export type EmployeeImportRoleReference = {
  id: string;
  name: string;
};

export type EmployeeImportManagerReference = {
  id: string;
  employeeId: string;
  name: string;
  roleName: string;
};

export type EmployeeImportRecentJob = {
  id: string;
  sourceFileName: string;
  fileType: EmployeeImportFileType;
  status: EmployeeImportJobStatus;
  totalRows: number;
  createdAt: string;
  successfulRows: number;
  failedRows: number;
};

export type EmployeeImportFoundationData = {
  companyName: string;
  employeeCount: number;
  roleCount: number;
  managerCount: number;
  supportedFormats: string[];
  templateColumns: EmployeeImportTemplateColumn[];
  wizardSteps: EmployeeImportWizardStep[];
  recentJobs: EmployeeImportRecentJob[];
  maxUploadSizeBytes: number;
};

export type EmployeeImportRowDraft = {
  rowNumber: number;
  employeeId: string;
  name: string;
  phone: string;
  roleName: string;
  managerEmployeeId: string;
  joiningDate: string;
  status: string;
  workMode: string;
  email: string;
  dateOfBirth: string;
  photoUrl: string;
};

export type EmployeeImportNormalizedRow = EmployeeImportRowDraft & {
  employeeId: string;
  name: string;
  phone: string;
  roleName: string;
  managerEmployeeId: string;
  joiningDate: string;
  status: string;
  workMode: EmployeeWorkMode;
  email: string;
  dateOfBirth: string;
  photoUrl: string;
  internalAuthEmail: string;
  defaultPassword: string;
};

export type EmployeeImportPreviewIssue = EmployeeImportValidationIssue & {
  severity: "error";
};

export type EmployeeImportPreviewRow = {
  rowNumber: number;
  raw: EmployeeImportRowDraft;
  normalized: EmployeeImportNormalizedRow;
  issues: EmployeeImportPreviewIssue[];
  duplicateFields: string[];
  status: "valid" | "invalid";
};

export type EmployeeImportPreviewSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
};

export type EmployeeImportPreviewResult = {
  jobId: string;
  fileName: string;
  fileType: EmployeeImportFileType;
  rows: EmployeeImportPreviewRow[];
  summary: EmployeeImportPreviewSummary;
  pipeline: EmployeeImportPipelineStage[];
};

export type EmployeeImportActionState =
  | {
      ok: true;
      preview: EmployeeImportPreviewResult;
    }
  | {
      ok: false;
      message: string;
      issues: EmployeeImportValidationIssue[];
    };

export type EmployeeImportBatchRowResult = {
  rowNumber: number;
  employeeId: string;
  name: string;
  status: "imported" | "failed" | "skipped";
  reason: string;
};

export type EmployeeImportProgressResult = {
  ok: true;
  jobId: string;
  status: EmployeeImportJobStatus;
  importedCount: number;
  failedCount: number;
  remainingCount: number;
  skippedCount: number;
  duplicateCount: number;
  totalRows: number;
  completed: boolean;
  rows: EmployeeImportBatchRowResult[];
};

export type EmployeeImportExecutionState =
  | EmployeeImportProgressResult
  | {
      ok: false;
      message: string;
    };

export type EmployeeImportFailedRowExport = {
  rowNumber: number;
  employeeId: string;
  employeeName: string;
  phone: string;
  roleName: string;
  managerEmployeeId: string;
  joiningDate: string;
  status: string;
  workMode: string;
  email: string;
  dateOfBirth: string;
  photoUrl: string;
  reason: string;
};

export type EmployeeImportValidationCatalog = {
  roleByName: Map<string, EmployeeImportRoleReference>;
  managerByEmployeeId: Map<string, EmployeeImportManagerReference>;
  existingEmployeeIds: Set<string>;
  existingPhones: Set<string>;
  existingInternalAuthEmails: Set<string>;
};

export type EmployeeImportFoundationHooks = {
  notification: Omit<CreateNotificationInput, "companyId" | "employeeId">;
};

export type EmployeeImportJobContext = {
  id: string;
  companyId: string;
  createdBy: string | null;
  sourceFileName: string;
  fileType: EmployeeImportFileType;
  status: EmployeeImportJobStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  metadata: Record<string, unknown>;
};
