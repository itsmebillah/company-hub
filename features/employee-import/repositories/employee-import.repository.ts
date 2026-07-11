import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/types";
import type {
  EmployeeImportFailedRowExport,
  EmployeeImportFileType,
  EmployeeImportJobContext,
  EmployeeImportPreviewRow,
  EmployeeImportRecentJob,
  EmployeeImportRoleReference,
  EmployeeImportManagerReference,
} from "@/features/employee-import/types/employee-import.types";

export const EmployeeImportRepository = {
  async getCompanyById(companyId: string) {
    const supabase = createSupabaseAdminClient();
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
    const [{ data: roles, error: rolesError }, { data, error }] = await Promise.all([
      supabase
        .from("roles")
        .select("id, name")
        .eq("company_id", companyId)
        .eq("status", "active"),
      supabase
        .from("employees")
        .select("id, employee_id, name, role_id")
        .eq("company_id", companyId)
        .eq("status", "active")
        .order("name", { ascending: true }),
    ]);

    if (rolesError) {
      throw new Error("Unable to load manager roles.");
    }

    if (error) {
      throw new Error("Unable to load managers.");
    }

    const roleById = new Map(roles.map((role) => [role.id, role.name] as const));

    return data.map((manager) => ({
      id: manager.id,
      employeeId: manager.employee_id,
      name: manager.name,
      roleName: roleById.get(manager.role_id) ?? "Unknown",
    }));
  },

  async listExistingEmployees(companyId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .select("employee_id, phone, internal_auth_email")
      .eq("company_id", companyId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("Unable to load employee import references.");
    }

    return data;
  },

  async listRecentJobs(companyId: string, limit = 5): Promise<EmployeeImportRecentJob[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employee_import_jobs")
      .select(
        "id, source_file_name, file_type, status, total_rows, created_at, successful_rows, failed_rows",
      )
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
      successfulRows: job.successful_rows,
      failedRows: job.failed_rows,
    }));
  },

  async createPreviewJob(input: {
    companyId: string;
    createdBy: string | null;
    fileName: string;
    fileType: EmployeeImportFileType;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
  }) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employee_import_jobs")
      .insert({
        company_id: input.companyId,
        created_by: input.createdBy,
        source_file_name: input.fileName,
        file_type: input.fileType,
        status: "preview_ready",
        total_rows: input.totalRows,
        valid_rows: input.validRows,
        invalid_rows: input.invalidRows,
        metadata: {
          duplicateRows: input.duplicateRows,
        },
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("Unable to create import job.");
    }

    return data.id;
  },

  async replacePreviewRows(jobId: string, rows: EmployeeImportPreviewRow[]) {
    const supabase = createSupabaseAdminClient();

    const { error: deleteError } = await supabase
      .from("employee_import_rows")
      .delete()
      .eq("import_job_id", jobId);

    if (deleteError) {
      throw new Error("Unable to prepare import preview rows.");
    }

    if (rows.length === 0) {
      return;
    }

    const { error } = await supabase.from("employee_import_rows").insert(
      rows.map((row) => ({
        import_job_id: jobId,
        row_number: row.rowNumber,
        raw_data: row.raw,
        normalized_data: row.normalized,
        validation_errors: row.issues,
        duplicate_keys: row.duplicateFields,
        status: row.status === "valid" ? "valid" : "invalid",
        employee_id: row.normalized.employeeId || null,
      })),
    );

    if (error) {
      throw new Error("Unable to save import preview rows.");
    }
  },

  async getJobContext(jobId: string): Promise<EmployeeImportJobContext | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employee_import_jobs")
      .select(
        "id, company_id, created_by, source_file_name, file_type, status, total_rows, valid_rows, invalid_rows, processed_rows, successful_rows, failed_rows, metadata",
      )
      .eq("id", jobId)
      .maybeSingle();

    if (error) {
      throw new Error("Unable to load import job.");
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      companyId: data.company_id,
      createdBy: data.created_by,
      sourceFileName: data.source_file_name,
      fileType: data.file_type,
      status: data.status,
      totalRows: data.total_rows,
      validRows: data.valid_rows,
      invalidRows: data.invalid_rows,
      processedRows: data.processed_rows,
      successfulRows: data.successful_rows,
      failedRows: data.failed_rows,
      metadata:
        data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
          ? (data.metadata as Record<string, unknown>)
          : {},
    };
  },

  async markJobProcessing(jobId: string) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("employee_import_jobs")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      throw new Error("Unable to update import job status.");
    }
  },

  async getNextPendingValidRows(jobId: string, limit: number) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employee_import_rows")
      .select(
        "id, row_number, raw_data, normalized_data, validation_errors, duplicate_keys, status, employee_id",
      )
      .eq("import_job_id", jobId)
      .eq("status", "valid")
      .order("row_number", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error("Unable to load import rows.");
    }

    return data;
  },

  async updateRowResults(
    rowUpdates: Array<{
      id: string;
      status: "processed" | "failed";
      validationErrors: Json[];
    }>,
  ) {
    if (rowUpdates.length === 0) {
      return;
    }

    const supabase = createSupabaseAdminClient();

    for (const row of rowUpdates) {
      const { error } = await supabase
        .from("employee_import_rows")
        .update({
          status: row.status,
          validation_errors: row.validationErrors,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (error) {
        throw new Error("Unable to update import row results.");
      }
    }
  },

  async updateJobProgress(input: {
    jobId: string;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    status?: "processing" | "completed" | "failed";
  }) {
    const supabase = createSupabaseAdminClient();
    const payload: Database["public"]["Tables"]["employee_import_jobs"]["Update"] = {
      processed_rows: input.processedRows,
      successful_rows: input.successfulRows,
      failed_rows: input.failedRows,
      updated_at: new Date().toISOString(),
    };

    if (input.status) {
      payload.status = input.status;
    }

    if (input.status === "completed" || input.status === "failed") {
      payload.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("employee_import_jobs")
      .update(payload)
      .eq("id", input.jobId);

    if (error) {
      throw new Error("Unable to update import job progress.");
    }
  },

  async insertEmployees(
    rows: Database["public"]["Tables"]["employees"]["Insert"][],
  ) {
    if (rows.length === 0) {
      return [] as Array<{ id: string; employee_id: string }>;
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .insert(rows)
      .select("id, employee_id");

    if (error) {
      throw new Error(error.message || "Unable to create imported employees.");
    }

    return data;
  },

  async deleteImportedEmployees(employeeIds: string[]) {
    if (employeeIds.length === 0) {
      return;
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("employees").delete().in("id", employeeIds);

    if (error) {
      throw new Error("Unable to rollback imported employees.");
    }
  },

  async getFailedRows(jobId: string): Promise<EmployeeImportFailedRowExport[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("employee_import_rows")
      .select("row_number, raw_data, validation_errors, status")
      .eq("import_job_id", jobId)
      .in("status", ["invalid", "failed"])
      .order("row_number", { ascending: true });

    if (error) {
      throw new Error("Unable to load failed rows.");
    }

    return data.map((row) => {
      const raw =
        row.raw_data && typeof row.raw_data === "object" && !Array.isArray(row.raw_data)
          ? (row.raw_data as Record<string, unknown>)
          : {};
      const validationErrors = Array.isArray(row.validation_errors)
        ? row.validation_errors
        : [];
      const reason = validationErrors
        .map((issue) =>
          issue && typeof issue === "object" && "message" in issue
            ? String((issue as { message?: unknown }).message ?? "")
            : "",
        )
        .filter(Boolean)
        .join("; ");

      return {
        rowNumber: row.row_number,
        employeeId: String(raw.employeeId ?? ""),
        employeeName: String(raw.name ?? ""),
        phone: String(raw.phone ?? ""),
        roleName: String(raw.roleName ?? ""),
        managerEmployeeId: String(raw.managerEmployeeId ?? ""),
        joiningDate: String(raw.joiningDate ?? ""),
        status: String(raw.status ?? ""),
        workMode: String(raw.workMode ?? ""),
        email: String(raw.email ?? ""),
        dateOfBirth: String(raw.dateOfBirth ?? ""),
        photoUrl: String(raw.photoUrl ?? ""),
        reason,
      };
    });
  },
};
