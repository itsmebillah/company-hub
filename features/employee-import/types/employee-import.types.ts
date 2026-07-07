import type { ActivityLogInput } from "@/features/activity/types/activity.types";
import type { CreateNotificationInput } from "@/features/notifications/types/notification.types";
import type { Database } from "@/lib/supabase/types";

export type EmployeeImportJobStatus =
  Database["public"]["Enums"]["employee_import_status"];
export type EmployeeImportRowStatus =
  Database["public"]["Enums"]["employee_import_row_status"];
export type EmployeeImportFileType =
  Database["public"]["Enums"]["employee_import_file_type"];

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
};

export type EmployeeImportUploadValues = {
  file: EmployeeImportFileMetadata;
};

export type EmployeeImportValidationIssue = {
  field: string;
  message: string;
};

export type EmployeeImportPreparedFile = {
  fileName: string;
  fileType: EmployeeImportFileType;
  normalizedFileName: string;
  size: number;
  pipeline: EmployeeImportPipelineStage[];
  progressLabel: string;
};

export type EmployeeImportActionState =
  | {
      ok: true;
      message: string;
      preparedFile: EmployeeImportPreparedFile;
      issues: [];
    }
  | {
      ok: false;
      message: string;
      issues: EmployeeImportValidationIssue[];
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
};

export type EmployeeImportRecentJob = {
  id: string;
  sourceFileName: string;
  fileType: EmployeeImportFileType;
  status: EmployeeImportJobStatus;
  totalRows: number;
  createdAt: string;
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
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  joiningDate: string;
  roleName: string;
  managerEmployeeId: string;
  status: string;
};

export type EmployeeImportNormalizedRow = EmployeeImportRowDraft & {
  internalAuthEmail: string;
  defaultPassword: string;
};

export type EmployeeImportValidationCatalog = {
  roleNames: string[];
  managerEmployeeIds: string[];
  employeeIds: string[];
};

export type EmployeeImportFoundationHooks = {
  activityLog: Omit<
    ActivityLogInput,
    "companyId" | "employeeId" | "ipAddress" | "userAgent"
  >;
  notification: Omit<CreateNotificationInput, "companyId" | "employeeId">;
};
