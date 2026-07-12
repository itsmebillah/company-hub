import type { Database } from "@/lib/supabase/types";
import type { CelebrationPreferenceValues } from "@/features/company-settings/types/company-settings.types";

export type CelebrationEventType =
  Database["public"]["Enums"]["celebration_event_type"];

export type CelebrationItem = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  eventType: CelebrationEventType;
  sourceDate: string;
  yearsCompleted: number | null;
};

export type CelebrationDashboardData = {
  birthdays: CelebrationItem[];
  workAnniversaries: CelebrationItem[];
};

export type CelebrationCompanyContext = {
  companyId: string;
  companyName: string;
  timezone: string;
  settings: CelebrationPreferenceValues;
};

export type CelebrationSchedulerResult = {
  processedCompanies: number;
  skippedCompanies: number;
  createdEvents: number;
  createdNotifications: number;
};
