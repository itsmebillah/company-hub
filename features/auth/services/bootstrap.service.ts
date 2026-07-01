import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ROLE_NAMES } from "@/lib/auth/permissions";
import { loginWithEmployeeId } from "@/features/auth/services/login.service";
import type { Database } from "@/lib/supabase/types";

const INTERNAL_AUTH_EMAIL_DOMAIN = "companyhub.local";

type BootstrapAdminInput = {
  companyName: string;
  shortName: string;
  companyLogo: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  supportPhone: string;
  employeeId: string;
  name: string;
  phone: string;
  password: string;
};

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type CompanySettingsRow =
  Database["public"]["Tables"]["company_settings"]["Row"];

function createInternalAuthEmail(employeeId: string) {
  const normalizedEmployeeId = employeeId.trim().toUpperCase();

  return `${normalizedEmployeeId}@${INTERNAL_AUTH_EMAIL_DOMAIN}`;
}

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

function normalizeColor(value: string, fallback: string) {
  const nextValue = value.trim();

  return /^#[0-9a-fA-F]{6}$/.test(nextValue) ? nextValue : fallback;
}

function assertBootstrapInput(input: BootstrapAdminInput) {
  if (!input.companyName.trim()) {
    throw new Error("Company name is required.");
  }

  if (!input.employeeId.trim()) {
    throw new Error("Employee ID is required.");
  }

  if (!input.name.trim()) {
    throw new Error("Full name is required.");
  }

  if (!input.phone.trim()) {
    throw new Error("Phone is required.");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
}

async function getFirstCompany() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, status, created_at, updated_at, created_by, updated_by")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error("Unable to check company setup status.");
  }

  return data[0] ?? null;
}

async function getAdminRoleId(companyId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id")
    .eq("company_id", companyId)
    .eq("name", ROLE_NAMES.admin)
    .limit(1);

  if (error) {
    throw new Error("Unable to check Admin role.");
  }

  return data[0]?.id ?? null;
}

export async function hasBootstrapAdmin() {
  const supabase = createSupabaseAdminClient();
  const company = await getFirstCompany();

  if (!company) {
    return false;
  }

  const adminRoleId = await getAdminRoleId(company.id);

  if (!adminRoleId) {
    return false;
  }

  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", company.id)
    .eq("role_id", adminRoleId)
    .eq("status", "active")
    .limit(1);

  if (error) {
    throw new Error("Unable to check bootstrap status.");
  }

  return data.length > 0;
}

async function assertEmployeeIdAvailable(employeeId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .ilike("employee_id", employeeId)
    .limit(1);

  if (error) {
    throw new Error("Unable to validate Employee ID.");
  }

  if (data.length > 0) {
    throw new Error("Employee ID already exists.");
  }
}

async function rollbackSetup(input: {
  authUserId?: string;
  employeeId?: string;
  roleId?: string;
  companyId?: string;
  companyCreated: boolean;
  previousCompany: CompanyRow | null;
  previousSettings: CompanySettingsRow | null;
}) {
  const supabase = createSupabaseAdminClient();

  if (input.authUserId) {
    await supabase.auth.admin.deleteUser(input.authUserId);
  }

  if (input.employeeId) {
    await supabase.from("employees").delete().eq("id", input.employeeId);
  }

  if (input.companyCreated && input.companyId) {
    await supabase.from("companies").delete().eq("id", input.companyId);
    return;
  }

  if (input.roleId) {
    await supabase.from("roles").delete().eq("id", input.roleId);
  }

  if (input.previousCompany) {
    await supabase
      .from("companies")
      .update({
        name: input.previousCompany.name,
        status: input.previousCompany.status,
        updated_at: input.previousCompany.updated_at,
        updated_by: input.previousCompany.updated_by,
      })
      .eq("id", input.previousCompany.id);
  }

  if (!input.companyId) {
    return;
  }

  if (input.previousSettings) {
    await supabase
      .from("company_settings")
      .upsert(input.previousSettings, { onConflict: "company_id" });
  } else {
    await supabase
      .from("company_settings")
      .delete()
      .eq("company_id", input.companyId);
  }
}

export async function bootstrapFirstAdmin(input: BootstrapAdminInput) {
  assertBootstrapInput(input);

  if (await hasBootstrapAdmin()) {
    throw new Error("Bootstrap is already complete.");
  }

  const supabase = createSupabaseAdminClient();
  const employeeId = input.employeeId.trim().toUpperCase();
  const internalAuthEmail = createInternalAuthEmail(employeeId);
  const companyName = input.companyName.trim();
  const rollback = {
    authUserId: undefined as string | undefined,
    employeeId: undefined as string | undefined,
    roleId: undefined as string | undefined,
    companyId: undefined as string | undefined,
    companyCreated: false,
    previousCompany: null as CompanyRow | null,
    previousSettings: null as CompanySettingsRow | null,
  };

  try {
    await assertEmployeeIdAvailable(employeeId);

    const existingCompany = await getFirstCompany();
    let companyId = existingCompany?.id;

    if (!existingCompany) {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyName,
          status: "active",
        })
        .select("id")
        .single();

      if (companyError || !company) {
        throw new Error("Unable to create company.");
      }

      companyId = company.id;
      rollback.companyId = company.id;
      rollback.companyCreated = true;
    } else {
      rollback.companyId = existingCompany.id;
      rollback.previousCompany = existingCompany;

      const { error: companyUpdateError } = await supabase
        .from("companies")
        .update({
          name: companyName,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCompany.id);

      if (companyUpdateError) {
        throw new Error("Unable to update company.");
      }
    }

    if (!companyId) {
      throw new Error("Company setup could not be resolved.");
    }

    const { data: settings } = await supabase
      .from("company_settings")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    rollback.previousSettings = settings ?? null;

    let adminRoleId = await getAdminRoleId(companyId);

    if (!adminRoleId) {
      const { data: role, error: roleError } = await supabase
        .from("roles")
        .insert({
          company_id: companyId,
          name: ROLE_NAMES.admin,
          display_order: 1,
          status: "active",
        })
        .select("id")
        .single();

      if (roleError || !role) {
        throw new Error("Unable to create Admin role.");
      }

      adminRoleId = role.id;
      rollback.roleId = role.id;
    }

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

    rollback.authUserId = authUser.user.id;

    const { error: settingsError } = await supabase
      .from("company_settings")
      .upsert(
        {
          company_id: companyId,
          company_name: companyName,
          short_name: normalizeOptional(input.shortName),
          company_logo: normalizeOptional(input.companyLogo),
          primary_color: normalizeColor(input.primaryColor, "#2563EB"),
          secondary_color: normalizeColor(input.secondaryColor, "#16A34A"),
          support_email: normalizeOptional(input.supportEmail),
          support_phone: normalizeOptional(input.supportPhone),
          default_theme: "auto",
          status: "active",
        },
        { onConflict: "company_id" },
      );

    if (settingsError) {
      throw new Error("Unable to save company information.");
    }

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .insert({
        employee_id: employeeId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        company_id: companyId,
        role_id: adminRoleId,
        auth_user_id: authUser.user.id,
        internal_auth_email: internalAuthEmail,
        status: "active",
      })
      .select("id")
      .single();

    if (employeeError || !employee) {
      throw new Error("Unable to create administrator employee.");
    }

    rollback.employeeId = employee.id;

    await loginWithEmployeeId({
      employeeId,
      password: input.password,
      rememberMe: true,
    });
  } catch (error) {
    try {
      await rollbackSetup(rollback);
    } catch {
      // Preserve the original setup failure for the action's friendly message.
    }

    throw error;
  }
}
