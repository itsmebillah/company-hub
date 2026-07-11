export type CompanyTheme = "auto" | "light" | "dark";
export type CompanyLocationStatus = "active" | "inactive";
export type CompanyLanguage = "English" | "Bangla";
export type WorkingDay =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type NotificationPreferenceValues = {
  announcements: boolean;
  attendance: boolean;
  leave: boolean;
  approvals: boolean;
  system: boolean;
};

export type ResourcePreferenceValues = {
  openMode: "same_tab" | "new_tab" | "external";
  sorting: "featured_first" | "alphabetical" | "manual";
  visibilityDefaults: "permission_aware" | "company_wide" | "restricted";
};

export type SecurityPreferenceValues = {
  passwordPolicy: "standard" | "strong";
  sessionTimeoutMinutes: number;
  forceLogoutEnabled: boolean;
  permissionOnboardingVersion: number;
};

export type CompanyLocationValues = {
  id?: string;
  name: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  status: CompanyLocationStatus;
};

export type CompanySettingsValues = {
  companyName: string;
  shortName: string;
  logo: string;
  banner: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  theme: CompanyTheme;
  supportEmail: string;
  supportPhone: string;
  website: string;
  address: string;
  timezone: string;
  dateFormat: string;
  language: CompanyLanguage;
  currency: string;
  workingDays: WorkingDay[];
  officeStartTime: string;
  officeEndTime: string;
  notificationPreferences: NotificationPreferenceValues;
  resourcePreferences: ResourcePreferenceValues;
  securityPreferences: SecurityPreferenceValues;
  locations: CompanyLocationValues[];
};

export type CompanySettingsActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
