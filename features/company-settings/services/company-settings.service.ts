import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  CompanyLocationValues,
  CompanySettingsValues,
  CompanyTheme,
} from "@/features/company-settings/types/company-settings.types";

const DEFAULT_SETTINGS: Omit<CompanySettingsValues, "companyName"> = {
  shortName: "",
  logo: "",
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
  currency: "BDT",
  locations: [],
};

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
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("Company was not found.");
  }

  return data;
}

export async function getCompanySettings(): Promise<CompanySettingsValues> {
  const supabase = createSupabaseAdminClient();
  const company = await getActiveCompany();
  const [{ data, error }, locationsResult] = await Promise.all([
    supabase
    .from("company_settings")
    .select(
      "company_name, short_name, company_logo, favicon, primary_color, secondary_color, support_phone, support_email, website, address, timezone, date_format, currency, default_theme",
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
    throw new Error("Unable to load company settings.");
  }

  return {
    companyName: data?.company_name ?? company.name,
    shortName: data?.short_name ?? DEFAULT_SETTINGS.shortName,
    logo: data?.company_logo ?? DEFAULT_SETTINGS.logo,
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
    currency: data?.currency ?? DEFAULT_SETTINGS.currency,
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
      favicon: normalizeOptional(values.favicon),
      primary_color: normalizeOptional(values.primaryColor),
      secondary_color: normalizeOptional(values.secondaryColor),
      support_email: normalizeOptional(values.supportEmail),
      support_phone: normalizeOptional(values.supportPhone),
      website: normalizeOptional(values.website),
      address: normalizeOptional(values.address),
      timezone: normalizeOptional(values.timezone),
      date_format: normalizeOptional(values.dateFormat),
      currency: normalizeOptional(values.currency),
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
    },
  });
}
