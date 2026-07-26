import "server-only";

import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import { toSupabaseEmployeePassword } from "@/features/auth/utils/employee-password";
import { requireSystemAdmin } from "@/features/platform-control/services/system-admin.service";
import type {
  CompanyFeatureState,
  FeatureKey,
  FeatureState,
  PlatformEmployeeFilters,
  PlatformSettingsValues,
  PlatformCompanyStatus,
} from "@/features/platform-control/types/platform.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
const PEOPLE_PAGE_SIZE = 25;

function optionalText(value: string) {
  const nextValue = value.trim();
  return nextValue || null;
}

function assertPlatformSettings(values: PlatformSettingsValues) {
  if (values.platformName.trim().length < 2) {
    throw new Error("Platform name is required.");
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(values.primaryColor)) {
    throw new Error("Primary color must be a six-digit hex color.");
  }
  if (
    values.supportEmail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.supportEmail.trim())
  ) {
    throw new Error("Support email is invalid.");
  }
}

export const PlatformControlService = {
  async getDashboard() {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    const [
      companies,
      employees,
      admins,
      attendance,
      announcements,
      features,
      usage,
      recentCompanies,
    ] = await Promise.all([
      supabase.from("companies").select("id, platform_status"),
      supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("employees")
        .select("id, roles!inner(name)", { count: "exact", head: true })
        .eq("status", "active")
        .eq("roles.name", "Company Admin"),
      supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq("attendance_date", today),
      supabase
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("platform_features").select("feature_key, state"),
      supabase
        .from("feature_usage_daily")
        .select("request_count")
        .gte(
          "usage_date",
          new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
        ),
      supabase
        .from("platform_company_overview")
        .select("id, name, platform_status, created_at, employee_count")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      companies: companies.data ?? [],
      activeEmployees: employees.count ?? 0,
      activeAdmins: admins.count ?? 0,
      todayAttendance: attendance.count ?? 0,
      activeAnnouncements: announcements.count ?? 0,
      features: features.data ?? [],
      featureRequests30Days: (usage.data ?? []).reduce(
        (total, item) => total + item.request_count,
        0,
      ),
      recentCompanies: recentCompanies.data ?? [],
      databaseHealthy:
        !companies.error &&
        !employees.error &&
        !announcements.error &&
        !features.error &&
        !recentCompanies.error,
    };
  },

  async listCompanies() {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("platform_company_overview")
      .select("*")
      .order("name");
    if (error) throw new Error("Unable to load companies.");
    return data;
  },

  async createCompany(name: string) {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { data: settings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("allow_company_creation")
      .eq("id", true)
      .single();
    if (settingsError || !settings?.allow_company_creation) {
      throw new Error("Company creation is disabled in platform settings.");
    }
    const { data, error } = await supabase.rpc("create_platform_company", {
      company_name: name,
    });
    if (error || !data) throw new Error("Unable to create company.");
    return data;
  },

  async updateCompanyStatus(
    companyId: string,
    status: PlatformCompanyStatus,
    confirmation = "",
  ) {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();
    if (companyError || !company) throw new Error("Company was not found.");
    if (status === "deleted" && confirmation.trim() !== company.name) {
      throw new Error("Type the exact company name to confirm deletion.");
    }
    const { error } = await supabase
      .from("companies")
      .update({ platform_status: status, updated_at: new Date().toISOString() })
      .eq("id", companyId);
    if (error) throw new Error("Unable to update company status.");
  },

  async updateCompanyName(companyId: string, name: string) {
    await requireSystemAdmin();
    const nextName = name.trim();
    if (nextName.length < 2) throw new Error("Company name is required.");
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.rpc("update_platform_company_name", {
      target_company_id: companyId,
      target_company_name: nextName,
    });
    if (error) throw new Error("Unable to update company.");

  },

  async listPeople(filters: PlatformEmployeeFilters = {}) {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const page = Math.max(filters.page ?? 1, 1);
    let query = supabase
      .from("employees")
      .select(
        "id, employee_id, name, status, company_id, auth_user_id, created_at, companies!inner(name), roles!employees_role_company_fk!inner(name)",
        { count: "exact" },
      );
    if (filters.companyId) query = query.eq("company_id", filters.companyId);
    if (filters.role) query = query.eq("roles.name", filters.role);
    if (filters.status)
      query = query.eq(
        "status",
        filters.status as "active" | "inactive" | "archived",
      );
    if (filters.search) {
      const search = filters.search.replace(/[%_,()]/g, "").trim();
      query = query.or(`employee_id.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * PEOPLE_PAGE_SIZE, page * PEOPLE_PAGE_SIZE - 1);
    if (error) throw new Error("Unable to load platform employees.");
    const rows = (data ?? []) as unknown as Array<{
      id: string;
      employee_id: string;
      name: string;
      status: "active" | "inactive" | "archived";
      company_id: string;
      auth_user_id: string | null;
      created_at: string;
      companies: { name: string } | null;
      roles: { name: string } | null;
    }>;
    return {
      items: rows.map((item) => ({
        id: item.id,
        employeeId: item.employee_id,
        name: item.name,
        status: item.status,
        companyId: item.company_id,
        companyName: item.companies?.name ?? "Unknown company",
        roleName: item.roles?.name ?? "No active role",
        canResetPassword: Boolean(item.auth_user_id),
        createdAt: item.created_at,
      })),
      count: count ?? 0,
      page,
      pageSize: PEOPLE_PAGE_SIZE,
    };
  },

  async listPeopleFilterOptions() {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const [{ data: roles, error }, companies] = await Promise.all([
      supabase.from("roles").select("name").order("name"),
      this.listCompanies(),
    ]);
    if (error) throw new Error("Unable to load platform people filters.");
    return {
      companies,
      roles: [...new Set(roles.map((role) => role.name))],
    };
  },

  async listSystemAdmins() {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("platform_admins")
      .select("id, display_name, status, created_at")
      .order("display_name");
    if (error) throw new Error("Unable to load System Admins.");
    return data;
  },

  async resetEmployeePassword(employeeId: string, confirmation: string) {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { data: employee, error } = await supabase
      .from("employees")
      .select("id, employee_id, auth_user_id, company_id")
      .eq("id", employeeId)
      .single();
    if (error || !employee?.auth_user_id) {
      throw new Error("Employee authentication account was not found.");
    }
    if (confirmation.trim() !== employee.employee_id) {
      throw new Error("Type the exact Employee ID to confirm the reset.");
    }
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      employee.auth_user_id,
      {
        password: toSupabaseEmployeePassword(employee.employee_id),
      },
    );
    if (updateError) throw new Error("Unable to reset employee password.");
  },

  async getSettings(): Promise<PlatformSettingsValues> {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", true)
      .single();
    if (error || !data) throw new Error("Unable to load platform settings.");
    return {
      platformName: data.platform_name,
      logoUrl: data.logo_url ?? "",
      faviconUrl: data.favicon_url ?? "",
      primaryColor: data.primary_color,
      supportEmail: data.support_email ?? "",
      defaultTimezone: data.default_timezone,
      maintenanceMessage: data.maintenance_message ?? "",
      maintenanceMode: data.maintenance_mode,
      allowCompanyCreation: data.allow_company_creation,
    };
  },

  async updateSettings(values: PlatformSettingsValues) {
    const actor = await requireSystemAdmin();
    assertPlatformSettings(values);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("platform_settings").upsert({
      id: true,
      platform_name: values.platformName.trim(),
      logo_url: optionalText(values.logoUrl),
      favicon_url: optionalText(values.faviconUrl),
      primary_color: values.primaryColor.toUpperCase(),
      support_email: optionalText(values.supportEmail),
      default_timezone: values.defaultTimezone.trim() || "UTC",
      maintenance_message: optionalText(values.maintenanceMessage),
      maintenance_mode: values.maintenanceMode,
      allow_company_creation: values.allowCompanyCreation,
      updated_by: actor.id,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Unable to update platform settings.");
  },

  async listFeatures(companyId?: string) {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const [
      { data: features, error },
      { data: overrides, error: overrideError },
      { data: usage, error: usageError },
      { data: companySummary, error: companySummaryError },
    ] = await Promise.all([
      supabase.from("platform_features").select("*").order("display_order"),
      companyId
        ? supabase
            .from("company_features")
            .select("*")
            .eq("company_id", companyId)
        : Promise.resolve({ data: [], error: null }),
      companyId
        ? supabase
            .from("feature_usage_daily")
            .select("feature_key, request_count")
            .eq("company_id", companyId)
            .gte(
              "usage_date",
              new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
            )
        : supabase
            .from("feature_usage_daily")
            .select("feature_key, request_count")
            .gte(
              "usage_date",
              new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
            ),
      supabase.from("platform_feature_company_summary").select("*"),
    ]);
    if (error || overrideError || usageError || companySummaryError)
      throw new Error("Unable to load features.");
    const usageByFeature = new Map<string, number>();
    usage.forEach((item) =>
      usageByFeature.set(
        item.feature_key,
        (usageByFeature.get(item.feature_key) ?? 0) + item.request_count,
      ),
    );
    const companySummaryByFeature = new Map(
      companySummary.map((item) => [item.feature_key, item]),
    );
    return {
      features,
      overrides,
      companyId,
      usageByFeature,
      companySummaryByFeature,
    };
  },

  async updatePlatformFeature(
    featureKey: FeatureKey,
    state: FeatureState,
    allowCompanyOverride: boolean,
  ) {
    const actor = await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("platform_features")
      .update({
        state,
        allow_company_override: allowCompanyOverride,
        updated_at: new Date().toISOString(),
        updated_by: actor.id,
      })
      .eq("feature_key", featureKey);
    if (error) throw new Error("Unable to update platform feature.");
  },

  async updateCompanyFeature(
    companyId: string,
    featureKey: FeatureKey,
    state: CompanyFeatureState,
  ) {
    const actor = await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("company_features").upsert(
      {
        company_id: companyId,
        feature_key: featureKey,
        state: state === "disabled" ? "disabled" : "enabled",
        company_state: state,
        updated_at: new Date().toISOString(),
        updated_by_platform_admin_id: actor.id,
      },
      { onConflict: "company_id,feature_key" },
    );
    if (error) throw new Error("Unable to update company feature.");
  },

  async updateOwnCompanyFeature(
    featureKey: FeatureKey,
    state: CompanyFeatureState,
  ) {
    const profile = await requireCompanyAdmin();
    const supabase = createSupabaseAdminClient();
    const { data: platformFeature } = await supabase
      .from("platform_features")
      .select("state, allow_company_override")
      .eq("feature_key", featureKey)
      .single();
    if (platformFeature?.state !== "enabled")
      throw new Error("This feature is disabled at platform level.");
    if (!platformFeature.allow_company_override)
      throw new Error("Company overrides are disabled for this feature.");
    const { error } = await supabase.from("company_features").upsert(
      {
        company_id: profile.companyId,
        feature_key: featureKey,
        state: state === "disabled" ? "disabled" : "enabled",
        company_state: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,feature_key" },
    );
    if (error) throw new Error("Unable to update company feature.");
  },

};
