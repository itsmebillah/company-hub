import type { Json } from "@/lib/supabase/types";

export type FeatureKey =
  | "attendance"
  | "quick_links"
  | "knowledge_hub"
  | "resources"
  | "announcements"
  | "leave"
  | "reports"
  | "notifications"
  | "calendar"
  | "employee_directory"
  | "profile"
  | "company_settings"
  | "role_management"
  | "future_modules";

export type FeatureState = "enabled" | "disabled";
export type PlatformCompanyStatus =
  "active" | "inactive" | "suspended" | "deleted";
export type AuditCategory =
  "audit" | "activity" | "login" | "security" | "feature_usage" | "error";
export type AuditStatus = "success" | "failure" | "denied" | "warning";

export type FeatureDefinition = {
  key: FeatureKey;
  name: string;
  description: string;
  state: FeatureState;
  companyState?: FeatureState;
  effectiveState: FeatureState;
  displayOrder: number;
};

export type AuditEventInput = {
  category: AuditCategory;
  action: string;
  entityType: string;
  entityId?: string | null;
  status?: AuditStatus;
  description: string;
  companyId?: string | null;
  employeeId?: string | null;
  platformAdminId?: string | null;
  authUserId?: string | null;
  featureKey?: FeatureKey | null;
  metadata?: Json;
};
