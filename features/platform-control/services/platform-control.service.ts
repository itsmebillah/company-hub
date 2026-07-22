import "server-only";

import { requireAdmin } from "@/features/auth/services/authorization.service";
import { toSupabaseEmployeePassword } from "@/features/auth/utils/employee-password";
import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";
import { requireSystemAdmin } from "@/features/platform-control/services/system-admin.service";
import type {
  AuditCategory,
  FeatureKey,
  FeatureState,
  PlatformEmployeeFilters,
  PlatformSettingsValues,
  PlatformCompanyStatus,
} from "@/features/platform-control/types/platform.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export type PlatformAuditFilters = {
  page?: number;
  companyId?: string;
  category?: AuditCategory;
  featureKey?: FeatureKey;
  status?: string;
  search?: string;
  employee?: string;
  role?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
};

const PAGE_SIZE = 25;
const PEOPLE_PAGE_SIZE = 25;
type AuditRow = Database["public"]["Tables"]["platform_audit_logs"]["Row"];

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
  if (
    !Number.isInteger(values.auditRetentionDays) ||
    values.auditRetentionDays < 30 ||
    values.auditRetentionDays > 3650
  ) {
    throw new Error("Audit retention must be between 30 and 3650 days.");
  }
}

async function enrichAuditItems(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  items: AuditRow[],
) {
  const employeeIds = [
    ...new Set(
      items.flatMap((item) => (item.employee_id ? [item.employee_id] : [])),
    ),
  ];
  if (!employeeIds.length) {
    return items.map((item) => ({
      ...item,
      actorName: null,
      actorEmployeeId: null,
      actorRole: null,
    }));
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, employee_id, role_id")
    .in("id", employeeIds);
  const roleIds = [...new Set((employees ?? []).map((item) => item.role_id))];
  const { data: roles } = roleIds.length
    ? await supabase.from("roles").select("id, name").in("id", roleIds)
    : { data: [] };
  const roleMap = new Map((roles ?? []).map((item) => [item.id, item.name]));
  const employeeMap = new Map(
    (employees ?? []).map((item) => [
      item.id,
      {
        actorName: item.name,
        actorEmployeeId: item.employee_id,
        actorRole: roleMap.get(item.role_id) ?? null,
      },
    ]),
  );

  return items.map((item) => ({
    ...item,
    ...(employeeMap.get(item.employee_id ?? "") ?? {
      actorName: null,
      actorEmployeeId: null,
      actorRole: null,
    }),
  }));
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
      security,
      recent,
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
        .eq("roles.name", "Admin"),
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
        .from("platform_audit_logs")
        .select("id", { count: "exact", head: true })
        .eq("category", "security")
        .gte("created_at", `${today}T00:00:00.000Z`),
      supabase
        .from("platform_audit_logs")
        .select("id, category, action, description, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
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
      securityEventsToday: security.count ?? 0,
      recentEvents: recent.data ?? [],
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
    const actor = await requireSystemAdmin();
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
    await PlatformAuditService.log({
      category: "audit",
      action: "company_created",
      entityType: "company",
      entityId: data,
      description: "System Admin created a company.",
      companyId: data,
      platformAdminId: actor.id,
    });
    return data;
  },

  async updateCompanyStatus(
    companyId: string,
    status: PlatformCompanyStatus,
    confirmation = "",
  ) {
    const actor = await requireSystemAdmin();
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
    await PlatformAuditService.log({
      category: "security",
      action:
        status === "active"
          ? "company_activated"
          : status === "inactive"
            ? "company_deactivated"
            : status === "suspended"
              ? "company_suspended"
              : status === "archived"
                ? "company_archived"
                : "company_deleted",
      entityType: "company",
      entityId: companyId,
      status: status === "active" ? "success" : "warning",
      description: `System Admin changed company platform status to ${status}.`,
      companyId,
      platformAdminId: actor.id,
      metadata: { status },
    });
  },

  async updateCompanyName(companyId: string, name: string) {
    const actor = await requireSystemAdmin();
    const nextName = name.trim();
    if (nextName.length < 2) throw new Error("Company name is required.");
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.rpc("update_platform_company_name", {
      target_company_id: companyId,
      target_company_name: nextName,
    });
    if (error) throw new Error("Unable to update company.");

    await PlatformAuditService.log({
      category: "audit",
      action: "company_updated",
      entityType: "company",
      entityId: companyId,
      description: "System Admin updated a company name.",
      companyId,
      platformAdminId: actor.id,
    });
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
    const actor = await requireSystemAdmin();
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
    await PlatformAuditService.log({
      category: "security",
      action: "password_reset",
      entityType: "employee",
      entityId: employee.id,
      description:
        "System Admin reset an employee password to its initial value.",
      companyId: employee.company_id,
      platformAdminId: actor.id,
    });
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
      allowCompanyCreation: data.allow_company_creation,
      auditRetentionDays: data.audit_retention_days,
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
      allow_company_creation: values.allowCompanyCreation,
      audit_retention_days: values.auditRetentionDays,
      updated_by: actor.id,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Unable to update platform settings.");
    await PlatformAuditService.log({
      category: "audit",
      action: "platform_settings_updated",
      entityType: "platform_settings",
      entityId: "global",
      description: "System Admin updated platform configuration.",
      platformAdminId: actor.id,
      metadata: {
        allowCompanyCreation: values.allowCompanyCreation,
        auditRetentionDays: values.auditRetentionDays,
      },
    });
  },

  async listFeatures(companyId?: string) {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const [
      { data: features, error },
      { data: overrides, error: overrideError },
      { data: usage, error: usageError },
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
    ]);
    if (error || overrideError || usageError)
      throw new Error("Unable to load features.");
    const usageByFeature = new Map<string, number>();
    usage.forEach((item) =>
      usageByFeature.set(
        item.feature_key,
        (usageByFeature.get(item.feature_key) ?? 0) + item.request_count,
      ),
    );
    return { features, overrides, companyId, usageByFeature };
  },

  async updatePlatformFeature(featureKey: FeatureKey, state: FeatureState) {
    const actor = await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("platform_features")
      .update({
        state,
        updated_at: new Date().toISOString(),
        updated_by: actor.id,
      })
      .eq("feature_key", featureKey);
    if (error) throw new Error("Unable to update platform feature.");
    await PlatformAuditService.log({
      category: "security",
      action: state === "enabled" ? "feature_enabled" : "feature_disabled",
      entityType: "platform_feature",
      entityId: featureKey,
      status: state === "enabled" ? "success" : "warning",
      description: `System Admin changed platform feature ${featureKey} to ${state}.`,
      featureKey,
      platformAdminId: actor.id,
      metadata: { state },
    });
  },

  async updateCompanyFeature(
    companyId: string,
    featureKey: FeatureKey,
    state: FeatureState,
  ) {
    const actor = await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("company_features").upsert(
      {
        company_id: companyId,
        feature_key: featureKey,
        state,
        updated_at: new Date().toISOString(),
        updated_by_platform_admin_id: actor.id,
      },
      { onConflict: "company_id,feature_key" },
    );
    if (error) throw new Error("Unable to update company feature.");
    await PlatformAuditService.log({
      category: "audit",
      action: state === "enabled" ? "feature_enabled" : "feature_disabled",
      entityType: "company_feature",
      entityId: featureKey,
      description: `System Admin changed a company feature to ${state}.`,
      companyId,
      featureKey,
      platformAdminId: actor.id,
      metadata: { state },
    });
  },

  async updateOwnCompanyFeature(featureKey: FeatureKey, state: FeatureState) {
    const profile = await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data: platformFeature } = await supabase
      .from("platform_features")
      .select("state")
      .eq("feature_key", featureKey)
      .single();
    if (platformFeature?.state !== "enabled")
      throw new Error("This feature is disabled at platform level.");
    const { error } = await supabase.from("company_features").upsert(
      {
        company_id: profile.companyId,
        feature_key: featureKey,
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,feature_key" },
    );
    if (error) throw new Error("Unable to update company feature.");
    await PlatformAuditService.log({
      category: "audit",
      action: state === "enabled" ? "feature_enabled" : "feature_disabled",
      entityType: "company_feature",
      entityId: featureKey,
      description: `Company Admin changed a feature to ${state}.`,
      companyId: profile.companyId,
      featureKey,
      metadata: { state },
    });
  },

  async listAuditLogs(
    filters: PlatformAuditFilters = {},
    pageSize = PAGE_SIZE,
  ) {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const page = Math.max(filters.page ?? 1, 1);
    let scopedEmployeeIds: string[] | null = null;

    if (filters.employee || filters.role) {
      let employeeQuery = supabase
        .from("employees")
        .select("id, role_id")
        .limit(500);
      if (filters.companyId) {
        employeeQuery = employeeQuery.eq("company_id", filters.companyId);
      }
      if (filters.employee) {
        const employee = filters.employee.replace(/[%_,()]/g, "").trim();
        employeeQuery = employeeQuery.or(
          `employee_id.ilike.%${employee}%,name.ilike.%${employee}%`,
        );
      }
      if (filters.role) {
        const { data: roles } = await supabase
          .from("roles")
          .select("id")
          .eq("name", filters.role);
        const roleIds = (roles ?? []).map((item) => item.id);
        if (!roleIds.length) return { items: [], count: 0, page, pageSize };
        employeeQuery = employeeQuery.in("role_id", roleIds);
      }
      const { data: employees, error: employeeError } = await employeeQuery;
      if (employeeError) throw new Error("Unable to filter audit employees.");
      scopedEmployeeIds = employees.map((item) => item.id);
      if (!scopedEmployeeIds.length)
        return { items: [], count: 0, page, pageSize };
    }

    let query = supabase
      .from("platform_audit_logs")
      .select("*", { count: "exact" });
    if (filters.companyId) query = query.eq("company_id", filters.companyId);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.featureKey) query = query.eq("feature_key", filters.featureKey);
    if (scopedEmployeeIds) query = query.in("employee_id", scopedEmployeeIds);
    if (filters.status) query = query.eq("status", filters.status as "success");
    if (filters.action)
      query = query.ilike(
        "action",
        `%${filters.action.replace(/[%_,()]/g, "")}%`,
      );
    if (filters.fromDate)
      query = query.gte("created_at", `${filters.fromDate}T00:00:00.000Z`);
    if (filters.toDate)
      query = query.lte("created_at", `${filters.toDate}T23:59:59.999Z`);
    if (filters.search)
      query = query.or(
        `action.ilike.%${filters.search.replace(/[%_,()]/g, "")}%,description.ilike.%${filters.search.replace(/[%_,()]/g, "")}%`,
      );
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error("Unable to load audit logs.");
    return {
      items: await enrichAuditItems(supabase, data),
      count: count ?? 0,
      page,
      pageSize,
    };
  },

  async listOwnCompanyAuditLogs(pageInput = 1) {
    const profile = await requireAdmin();
    const page = Math.max(pageInput, 1);
    const supabase = createSupabaseAdminClient();
    const { data, error, count } = await supabase
      .from("platform_audit_logs")
      .select("*", { count: "exact" })
      .eq("company_id", profile.companyId)
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (error) throw new Error("Unable to load company audit logs.");
    return {
      items: await enrichAuditItems(supabase, data),
      count: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    };
  },
};
