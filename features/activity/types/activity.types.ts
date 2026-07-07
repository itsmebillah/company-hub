import type { Json } from "@/lib/supabase/types";

export type ActivityModule =
  | "employee"
  | "announcement"
  | "resources"
  | "company_settings"
  | "roles"
  | "permissions"
  | "attendance"
  | "calendar"
  | "leave"
  | "future";

export type ActivityAction =
  | "created"
  | "updated"
  | "archived"
  | "restored"
  | "activated"
  | "deactivated"
  | "approved"
  | "rejected"
  | "cancelled";

export type ActivityLogInput = {
  companyId: string;
  employeeId?: string | null;
  module: ActivityModule;
  action: ActivityAction;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Json;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type ActivityLogItem = ActivityLogInput & {
  id: string;
  createdAt: string;
};
