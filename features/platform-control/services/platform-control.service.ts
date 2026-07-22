import "server-only";

import { requireAdmin } from "@/features/auth/services/authorization.service";
import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";
import { requireSystemAdmin } from "@/features/platform-control/services/system-admin.service";
import type {
  AuditCategory,
  FeatureKey,
  FeatureState,
  PlatformCompanyStatus,
} from "@/features/platform-control/types/platform.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PlatformAuditFilters = {
  page?: number;
  companyId?: string;
  category?: AuditCategory;
  featureKey?: FeatureKey;
  status?: string;
  search?: string;
};

const PAGE_SIZE = 25;

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
      features,
      security,
      recent,
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
      supabase.from("platform_features").select("feature_key, state"),
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
    ]);

    return {
      companies: companies.data ?? [],
      activeEmployees: employees.count ?? 0,
      activeAdmins: admins.count ?? 0,
      todayAttendance: attendance.count ?? 0,
      features: features.data ?? [],
      securityEventsToday: security.count ?? 0,
      recentEvents: recent.data ?? [],
      databaseHealthy: !companies.error && !employees.error && !features.error,
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

  async updateCompanyStatus(companyId: string, status: PlatformCompanyStatus) {
    const actor = await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("companies")
      .update({ platform_status: status, updated_at: new Date().toISOString() })
      .eq("id", companyId);
    if (error) throw new Error("Unable to update company status.");
    await PlatformAuditService.log({
      category: "security",
      action: "company_status_changed",
      entityType: "company",
      entityId: companyId,
      status: status === "active" ? "success" : "warning",
      description: `System Admin changed company platform status to ${status}.`,
      companyId,
      platformAdminId: actor.id,
      metadata: { status },
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
      action: "platform_feature_changed",
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
      action: "company_feature_changed",
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
      action: "company_feature_changed",
      entityType: "company_feature",
      entityId: featureKey,
      description: `Company Admin changed a feature to ${state}.`,
      companyId: profile.companyId,
      featureKey,
      metadata: { state },
    });
  },

  async listAuditLogs(filters: PlatformAuditFilters = {}) {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const page = Math.max(filters.page ?? 1, 1);
    let query = supabase
      .from("platform_audit_logs")
      .select("*", { count: "exact" });
    if (filters.companyId) query = query.eq("company_id", filters.companyId);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.featureKey) query = query.eq("feature_key", filters.featureKey);
    if (filters.status) query = query.eq("status", filters.status as "success");
    if (filters.search)
      query = query.or(
        `action.ilike.%${filters.search.replace(/[%_,()]/g, "")}%,description.ilike.%${filters.search.replace(/[%_,()]/g, "")}%`,
      );
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (error) throw new Error("Unable to load audit logs.");
    return { items: data, count: count ?? 0, page, pageSize: PAGE_SIZE };
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
    return { items: data, count: count ?? 0, page, pageSize: PAGE_SIZE };
  },
};
