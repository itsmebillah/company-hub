import "server-only";

import { requireCurrentCompanyId } from "@/features/auth/services/current-employee-context.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  EmployeeImportRecentJob,
  EmployeeImportRoleReference,
  EmployeeImportManagerReference,
} from "@/features/employee-import/types/employee-import.types";

export const EmployeeImportRepository = {
  async getActiveCompany() {
    const supabase = createSupabaseAdminClient();
    const companyId = await requireCurrentCompanyId();
    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new Error("Unable to load company information.");
    }

    return data;
  },

  async getEmployeeCount(companyId: string) {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (error) {
      throw new Error("Unable to load employee count.");
    }

    return count ?? 0;
  },

  async listRoleReferences(companyId: string): Promise<EmployeeImportRoleReference[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("roles")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error("Unable to load roles.");
    }

    return data;
  },

  async listManagerReferences(
    companyId: string,
  ): Promise<EmployeeImportManagerReference[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_id, name")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      throw new Error("Unable to load managers.");
    }

    return data.map((manager) => ({
      id: manager.id,
      employeeId: manager.employee_id,
      name: manager.name,
    }));
  },

  async listEmployeeIds(companyId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .select("employee_id")
      .eq("company_id", companyId);

    if (error) {
      throw new Error("Unable to load employee identifiers.");
    }

    return data.map((employee) => employee.employee_id);
  },

  async listRecentJobs(companyId: string, limit = 5): Promise<EmployeeImportRecentJob[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employee_import_jobs")
      .select("id, source_file_name, file_type, status, total_rows, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error("Unable to load import jobs.");
    }

    return data.map((job) => ({
      id: job.id,
      sourceFileName: job.source_file_name,
      fileType: job.file_type,
      status: job.status,
      totalRows: job.total_rows,
      createdAt: job.created_at,
    }));
  },
};
