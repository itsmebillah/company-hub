import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import {
  isValidTimeValue,
  parseTimeValueToMinutes,
} from "@/features/attendance/utils/working-hours";
import { CurrentCompanyContextService } from "@/features/auth/services/current-company-context.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  CompanyLanguage,
  CompanyLocationValues,
  CompanySettingsValues,
  CompanyTheme,
  WorkingDay,
} from "@/features/company-settings/types/company-settings.types";

const DEFAULT_SETTINGS: Omit<CompanySettingsValues, "companyName"> = {
  shortName: "",
  logo: "",
  banner: "",
  favicon: "",
  primaryColor: "#2563EB",
  secondaryColor: "#16A34A",
  theme: "auto",
  supportEmail: "",
  supportPhone: "",
  website: "",
  address: "",
  timezone: "Asia/Dhaka",
  dateFormat: "dd/MM/yyyy",
  language: "English",
  currency: "BDT",
  workingDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
  officeStartTime: "09:30",
  officeEndTime: "18:00",
  notificationPreferences: {
    announcements: true,
    attendance: true,
    leave: true,
    approvals: true,
    system: true,
  },
  resourcePreferences: {
    openMode: "new_tab",
    sorting: "featured_first",
    visibilityDefaults: "permission_aware",
  },
  securityPreferences: {
    passwordPolicy: "standard",
    sessionTimeoutMinutes: 480,
    forceLogoutEnabled: false,
    permissionOnboardingVersion: 1,
  },
  locations: [],
};

const VALID_WORKING_DAYS: WorkingDay[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function normalizeLanguage(value: string | null): CompanyLanguage {
  return value === "Bangla" ? "Bangla" : "English";
}

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

function normalizeLocationCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function normalizeTheme(value: string | null): CompanyTheme {
  if (value === "light" || value === "dark") {
    return value;
  }

  return "auto";
}

function validateSettings(values: CompanySettingsValues) {
  if (!values.companyName.trim()) {
    throw new Error("Company name is required.");
  }

  if (values.supportEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.supportEmail.trim())) {
    throw new Error("Support email is invalid.");
  }

  if (values.website.trim()) {
    try {
      new URL(values.website.trim());
    } catch {
      throw new Error("Website URL is invalid.");
    }
  }

  if (!["auto", "light", "dark"].includes(values.theme)) {
    throw new Error("Theme is invalid.");
  }

  if (!["English", "Bangla"].includes(values.language)) {
    throw new Error("Language is invalid.");
  }

  if (values.workingDays.length === 0) {
    throw new Error("At least one working day is required.");
  }

  if (
    values.workingDays.some(
      (day) => !VALID_WORKING_DAYS.includes(day as WorkingDay),
    )
  ) {
    throw new Error("Working days are invalid.");
  }

  if (!isValidTimeValue(values.officeStartTime)) {
    throw new Error("Office start time is invalid.");
  }

  if (!isValidTimeValue(values.officeEndTime)) {
    throw new Error("Office end time is invalid.");
  }

  const officeStartMinutes = parseTimeValueToMinutes(values.officeStartTime);
  const officeEndMinutes = parseTimeValueToMinutes(values.officeEndTime);

  if (
    officeStartMinutes === null ||
    officeEndMinutes === null ||
    officeEndMinutes <= officeStartMinutes
  ) {
    throw new Error("Office end time must be after office start time.");
  }

  if (values.securityPreferences.sessionTimeoutMinutes <= 0) {
    throw new Error("Session timeout must be greater than 0.");
  }

  values.locations.forEach((location, index) => {
    const label = `Office location ${index + 1}`;
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    const radiusMeters = Number(location.radiusMeters);

    if (!location.name.trim()) {
      throw new Error(`${label} name is required.`);
    }

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error(`${label} latitude is invalid.`);
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error(`${label} longitude is invalid.`);
    }

    if (!Number.isInteger(radiusMeters) || radiusMeters <= 0) {
      throw new Error(`${label} allowed radius must be a positive number.`);
    }

    if (location.status !== "active" && location.status !== "inactive") {
      throw new Error(`${label} status is invalid.`);
    }
  });
}

async function getActiveCompany() {
  return CurrentCompanyContextService.requireCurrentCompanyContext();
}

export async function getCompanySettings(): Promise<CompanySettingsValues> {
  const supabase = createSupabaseAdminClient();
  const company = await getActiveCompany();
  const [{ data, error }, locationsResult] = await Promise.all([
    supabase
      .from("company_settings")
      .select(
        "company_name, short_name, company_logo, company_banner, favicon, primary_color, secondary_color, default_theme, support_email, support_phone, website, address, timezone, date_format, language, currency, working_days, office_start_time, office_end_time, notification_preferences, resource_preferences, security_preferences",
      )
      .eq("company_id", company.id)
      .maybeSingle(),
    supabase
      .from("company_locations")
      .select("id, name, latitude, longitude, radius_meters, status")
      .eq("company_id", company.id)
      .neq("status", "archived")
      .order("name", { ascending: true }),
  ]);

  if (error || locationsResult.error) {
    console.error("[CompanySettingsService.getCompanySettings] Unable to load settings.", {
      companyId: company.id,
      settingsError: error,
      locationsError: locationsResult.error,
    });
    throw new Error("Unable to load company settings.");
  }

  return {
    companyName: data?.company_name ?? company.name,
    shortName: data?.short_name ?? DEFAULT_SETTINGS.shortName,
    logo: data?.company_logo ?? DEFAULT_SETTINGS.logo,
    banner: data?.company_banner ?? DEFAULT_SETTINGS.banner,
    favicon: data?.favicon ?? DEFAULT_SETTINGS.favicon,
    primaryColor: data?.primary_color ?? DEFAULT_SETTINGS.primaryColor,
    secondaryColor: data?.secondary_color ?? DEFAULT_SETTINGS.secondaryColor,
    theme: normalizeTheme(data?.default_theme ?? null),
    supportEmail: data?.support_email ?? DEFAULT_SETTINGS.supportEmail,
    supportPhone: data?.support_phone ?? DEFAULT_SETTINGS.supportPhone,
    website: data?.website ?? DEFAULT_SETTINGS.website,
    address: data?.address ?? DEFAULT_SETTINGS.address,
    timezone: data?.timezone ?? DEFAULT_SETTINGS.timezone,
    dateFormat: data?.date_format ?? DEFAULT_SETTINGS.dateFormat,
    language: normalizeLanguage(data?.language ?? null),
    currency: data?.currency ?? DEFAULT_SETTINGS.currency,
    workingDays:
      (data?.working_days?.filter((day): day is WorkingDay =>
        VALID_WORKING_DAYS.includes(day as WorkingDay),
      ) as WorkingDay[] | undefined) ?? DEFAULT_SETTINGS.workingDays,
    officeStartTime:
      data?.office_start_time ?? DEFAULT_SETTINGS.officeStartTime,
    officeEndTime: data?.office_end_time ?? DEFAULT_SETTINGS.officeEndTime,
    notificationPreferences: {
      ...DEFAULT_SETTINGS.notificationPreferences,
      ...(typeof data?.notification_preferences === "object" &&
      data.notification_preferences
        ? data.notification_preferences
        : {}),
    },
    resourcePreferences: {
      ...DEFAULT_SETTINGS.resourcePreferences,
      ...(typeof data?.resource_preferences === "object" &&
      data.resource_preferences
        ? data.resource_preferences
        : {}),
    },
    securityPreferences: {
      ...DEFAULT_SETTINGS.securityPreferences,
      ...(typeof data?.security_preferences === "object" &&
      data.security_preferences
        ? data.security_preferences
        : {}),
    },
    locations:
      locationsResult.data?.map(
        (location): CompanyLocationValues => ({
          id: location.id,
          name: location.name,
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          radiusMeters: String(location.radius_meters),
          status: location.status === "active" ? "active" : "inactive",
        }),
      ) ?? DEFAULT_SETTINGS.locations,
  };
}

export async function updateCompanySettings(values: CompanySettingsValues) {
  validateSettings(values);

  const supabase = createSupabaseAdminClient();
  const company = await getActiveCompany();
  const { error } = await supabase.from("company_settings").upsert(
    {
      company_id: company.id,
      company_name: values.companyName.trim(),
      short_name: normalizeOptional(values.shortName),
      company_logo: normalizeOptional(values.logo),
      company_banner: normalizeOptional(values.banner),
      favicon: normalizeOptional(values.favicon),
      primary_color: normalizeOptional(values.primaryColor),
      secondary_color: normalizeOptional(values.secondaryColor),
      support_email: normalizeOptional(values.supportEmail),
      support_phone: normalizeOptional(values.supportPhone),
      website: normalizeOptional(values.website),
      address: normalizeOptional(values.address),
      timezone: normalizeOptional(values.timezone),
      date_format: normalizeOptional(values.dateFormat),
      language: values.language,
      currency: normalizeOptional(values.currency),
      working_days: values.workingDays,
      office_start_time: values.officeStartTime,
      office_end_time: values.officeEndTime,
      notification_preferences: values.notificationPreferences,
      resource_preferences: values.resourcePreferences,
      security_preferences: values.securityPreferences,
      default_theme: values.theme,
      status: "active",
    },
    { onConflict: "company_id" },
  );

  if (error) {
    throw new Error("Unable to save company settings.");
  }

  const existingLocations = await supabase
    .from("company_locations")
    .select("id")
    .eq("company_id", company.id)
    .neq("status", "archived");

  if (existingLocations.error) {
    throw new Error("Unable to save office locations.");
  }

  const providedLocationIds = values.locations
    .map((location) => location.id)
    .filter((id): id is string => Boolean(id));
  const removedLocationIds = existingLocations.data
    .map((location) => location.id)
    .filter((id) => !providedLocationIds.includes(id));

  if (removedLocationIds.length > 0) {
    const removedResult = await supabase
      .from("company_locations")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .in("id", removedLocationIds);

    if (removedResult.error) {
      throw new Error("Unable to save office locations.");
    }
  }

  if (values.locations.length > 0) {
    const locationRows = values.locations.map((location) => ({
      ...(location.id ? { id: location.id } : {}),
      company_id: company.id,
      name: location.name.trim(),
      code: normalizeLocationCode(location.name),
      location_type: "branch" as const,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      radius_meters: Number(location.radiusMeters),
      status: location.status,
      updated_at: new Date().toISOString(),
    }));
    const locationsUpsert = await supabase
      .from("company_locations")
      .upsert(locationRows, { onConflict: "id" });

    if (locationsUpsert.error) {
      throw new Error("Unable to save office locations.");
    }
  }

  await logActivity({
    companyId: company.id,
    module: "company_settings",
    action: "updated",
    entityType: "company_settings",
    entityId: company.id,
    description: `Updated company settings for ${values.companyName.trim()}`,
    metadata: {
      companyName: values.companyName.trim(),
      theme: values.theme,
      language: values.language,
      workingDays: values.workingDays,
      permissionOnboardingVersion:
        values.securityPreferences.permissionOnboardingVersion,
    },
  });
}
