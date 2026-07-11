import "server-only";

import { CurrentEmployeeContextService } from "@/features/auth/services/current-employee-context.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CurrentCompanyContext = {
  id: string;
  name: string;
  status: "active" | "inactive" | "archived";
};

async function loadCurrentCompanyContext(): Promise<CurrentCompanyContext | null> {
  const employee = await CurrentEmployeeContextService.getCurrentEmployeeContext();

  if (!employee) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, status")
    .eq("id", employee.companyId)
    .maybeSingle();

  if (error) {
    console.error(
      "[CurrentCompanyContextService] Unable to load company context.",
      error,
    );
    throw new Error("Unable to load company context.");
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    status: data.status,
  };
}

async function requireActiveCurrentCompanyContext() {
  const employee =
    await CurrentEmployeeContextService.requireCurrentEmployeeContext();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, status")
    .eq("id", employee.companyId)
    .maybeSingle();

  if (error) {
    console.error(
      "[CurrentCompanyContextService] Unable to load company context.",
      error,
    );
    throw new Error("Unable to load company context.");
  }

  const company = data
    ? {
        id: data.id,
        name: data.name,
        status: data.status,
      }
    : null;

  if (!company || company.status !== "active") {
    throw new Error("Active company context was not found.");
  }

  return company;
}

export const CurrentCompanyContextService = {
  getCurrentCompanyContext: loadCurrentCompanyContext,
  requireCurrentCompanyContext: requireActiveCurrentCompanyContext,
  async requireCurrentCompanyId() {
    return (await CurrentEmployeeContextService.requireCurrentEmployeeContext())
      .companyId;
  },
};

export async function requireCurrentCompanyId() {
  return CurrentCompanyContextService.requireCurrentCompanyId();
}
