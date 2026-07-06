import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
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
};

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
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
  const { data, error } = await supabase
    .from("company_settings")
    .select(
      "company_name, short_name, company_logo, favicon, primary_color, secondary_color, support_phone, support_email, website, address, timezone, date_format, currency, default_theme",
    )
    .eq("company_id", company.id)
    .maybeSingle();

  if (error) {
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
