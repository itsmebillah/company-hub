import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ROLE_NAMES } from "@/lib/auth/permissions";
import { loginWithEmployeeId } from "@/features/auth/services/login.service";

const INTERNAL_AUTH_EMAIL_DOMAIN = "companyhub.local";

type BootstrapAdminInput = {
  companyName: string;
  companyLogo: string;
  supportEmail: string;
  supportPhone: string;
  employeeId: string;
  name: string;
  phone: string;
  password: string;
};

function createInternalAuthEmail(employeeId: string) {
  const normalizedEmployeeId = employeeId.trim().toUpperCase();

  return `${normalizedEmployeeId}@${INTERNAL_AUTH_EMAIL_DOMAIN}`;
}

async function getBootstrapCompanyAndAdminRole() {
  const supabase = createSupabaseAdminClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (companyError || !company) {
    throw new Error("Bootstrap company was not found.");
  }

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("company_id", company.id)
    .eq("name", ROLE_NAMES.admin)
    .single();

  if (roleError || !role) {
    throw new Error("Admin role was not found.");
  }

  return {
    companyId: company.id,
    adminRoleId: role.id,
  };
}

export async function hasBootstrapAdmin() {
  const supabase = createSupabaseAdminClient();
  const { companyId, adminRoleId } = await getBootstrapCompanyAndAdminRole();

  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", companyId)
    .eq("role_id", adminRoleId)
    .eq("status", "active")
    .limit(1);

  if (error) {
    throw new Error("Unable to check bootstrap status.");
  }

  return data.length > 0;
}

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

async function assertEmployeeIdAvailable(employeeId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_id", employeeId)
    .limit(1);

  if (error) {
    throw new Error("Unable to validate Employee ID.");
  }

  if (data.length > 0) {
    throw new Error("Employee ID already exists.");
  }
}

export async function bootstrapFirstAdmin(input: BootstrapAdminInput) {
  if (await hasBootstrapAdmin()) {
    throw new Error("Bootstrap is already complete.");
  }

  const supabase = createSupabaseAdminClient();
  const { companyId, adminRoleId } = await getBootstrapCompanyAndAdminRole();
  const employeeId = input.employeeId.trim().toUpperCase();
  const internalAuthEmail = createInternalAuthEmail(employeeId);
  const companyName = input.companyName.trim();

  await assertEmployeeIdAvailable(employeeId);

  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email: internalAuthEmail,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        employee_id: employeeId,
        company_id: companyId,
        bootstrap_admin: true,
      },
    });

  if (authError || !authUser.user) {
    throw new Error("Unable to create administrator account.");
  }

  const { error: settingsError } = await supabase
    .from("company_settings")
    .upsert(
      {
        company_id: companyId,
        company_name: companyName,
        company_logo: normalizeOptional(input.companyLogo),
        support_email: normalizeOptional(input.supportEmail),
        support_phone: normalizeOptional(input.supportPhone),
        default_theme: "auto",
        status: "active",
      },
      { onConflict: "company_id" },
    );

  if (settingsError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error("Unable to save company information.");
  }

  const { error: employeeError } = await supabase.from("employees").insert({
    employee_id: employeeId,
    name: input.name.trim(),
    phone: input.phone.trim(),
    company_id: companyId,
    role_id: adminRoleId,
    auth_user_id: authUser.user.id,
    internal_auth_email: internalAuthEmail,
    status: "active",
  });

  if (employeeError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error("Unable to create administrator employee.");
  }

  await loginWithEmployeeId({
    employeeId,
    password: input.password,
    rememberMe: true,
  });
}
