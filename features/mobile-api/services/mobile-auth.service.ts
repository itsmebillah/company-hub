import "server-only";

import { createClient, type Session, type User } from "@supabase/supabase-js";

import { resolveEmployeeAuthIdentity } from "@/features/auth/services/auth.service";
import { RequestAuthContextService } from "@/features/auth/services/request-auth-context.service";
import { toSupabaseEmployeePassword } from "@/features/auth/utils/employee-password";
import { MobileApiError } from "@/features/mobile-api/services/mobile-api-error";
import type {
  MobileAuthContext,
  MobileSession,
} from "@/features/mobile-api/types/mobile-api.types";
import { getSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

function createMobileAuthClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function resolveContext(user: User): Promise<MobileAuthContext> {
  const admin = createSupabaseAdminClient();
  const { data: employee, error } = await admin
    .from("employees")
    .select("id, employee_id, name, company_id, role_id, manager_id, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new MobileApiError(
      503,
      "identity_unavailable",
      "Identity verification is temporarily unavailable.",
      30,
    );
  }
  if (!employee || employee.status !== "active") {
    throw new MobileApiError(
      403,
      "active_employee_required",
      "An active employee account is required.",
    );
  }

  const [
    { data: company, error: companyError },
    { data: role, error: roleError },
  ] = await Promise.all([
    admin
      .from("companies")
      .select("id, status, platform_status")
      .eq("id", employee.company_id)
      .maybeSingle(),
    admin
      .from("roles")
      .select("id, name, status")
      .eq("id", employee.role_id)
      .eq("company_id", employee.company_id)
      .maybeSingle(),
  ]);

  if (companyError || roleError) {
    throw new MobileApiError(
      503,
      "identity_unavailable",
      "Identity verification is temporarily unavailable.",
      30,
    );
  }
  if (
    !company ||
    company.status !== "active" ||
    company.platform_status !== "active"
  ) {
    throw new MobileApiError(
      403,
      "active_company_required",
      "An active company account is required.",
    );
  }
  if (!role || role.status !== "active") {
    throw new MobileApiError(
      403,
      "active_role_required",
      "An active employee role is required.",
    );
  }

  return {
    user,
    employee: {
      id: employee.id,
      employeeId: employee.employee_id,
      name: employee.name,
      companyId: employee.company_id,
      roleId: employee.role_id,
      roleName: role.name,
      managerId: employee.manager_id,
      status: "active",
    },
  };
}

function toMobileSession(
  session: Session,
  context: MobileAuthContext,
): MobileSession {
  if (!session.refresh_token || !session.expires_at || !session.expires_in) {
    throw new MobileApiError(
      503,
      "session_unavailable",
      "A secure session could not be created.",
      30,
    );
  }
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    expiresIn: session.expires_in,
    tokenType: "bearer",
    profile: {
      employeeId: context.employee.employeeId,
      name: context.employee.name,
      companyId: context.employee.companyId,
      roleName: context.employee.roleName,
    },
  };
}

async function signOutToken(accessToken: string) {
  const admin = createSupabaseAdminClient();
  await admin.auth.admin.signOut(accessToken, "global");
}

export const MobileAuthService = {
  async createSession(employeeId: string, password: string) {
    let identity;
    try {
      identity = await resolveEmployeeAuthIdentity(employeeId);
    } catch {
      throw new MobileApiError(
        401,
        "invalid_credentials",
        "Employee ID or password is incorrect.",
      );
    }
    if (
      identity.status !== "active" ||
      !identity.authUserId ||
      !identity.internalAuthEmail
    ) {
      throw new MobileApiError(
        401,
        "invalid_credentials",
        "Employee ID or password is incorrect.",
      );
    }

    const client = createMobileAuthClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: identity.internalAuthEmail,
      password: toSupabaseEmployeePassword(password),
    });
    if (
      error ||
      !data.session ||
      !data.user ||
      data.user.id !== identity.authUserId
    ) {
      throw new MobileApiError(
        401,
        "invalid_credentials",
        "Employee ID or password is incorrect.",
      );
    }

    try {
      const context = await resolveContext(data.user);
      return toMobileSession(data.session, context);
    } catch (error) {
      await signOutToken(data.session.access_token).catch(() => undefined);
      throw error;
    }
  },

  async refreshSession(refreshToken: string) {
    const client = createMobileAuthClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session || !data.user) {
      throw new MobileApiError(
        401,
        "session_expired",
        "The session has expired. Sign in again.",
      );
    }
    try {
      const context = await resolveContext(data.user);
      return toMobileSession(data.session, context);
    } catch (error) {
      await signOutToken(data.session.access_token).catch(() => undefined);
      throw error;
    }
  },

  async authenticateRequest(request: Request) {
    const authorization = request.headers.get("authorization");
    const match = /^Bearer ([^\s]+)$/i.exec(authorization ?? "");
    if (!match) {
      throw new MobileApiError(
        401,
        "authentication_required",
        "Authentication is required.",
      );
    }
    const client = createMobileAuthClient();
    const { data, error } = await client.auth.getUser(match[1]);
    if (error || !data.user) {
      throw new MobileApiError(
        401,
        "session_expired",
        "The session has expired. Sign in again.",
      );
    }
    return { accessToken: match[1], context: await resolveContext(data.user) };
  },

  async runAuthenticated<T>(
    request: Request,
    operation: (context: MobileAuthContext) => Promise<T>,
  ) {
    const { context } = await this.authenticateRequest(request);
    return RequestAuthContextService.runWithAuthUser(context.user, () =>
      operation(context),
    );
  },

  async revoke(request: Request) {
    const { accessToken } = await this.authenticateRequest(request);
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.signOut(accessToken, "global");
    if (error) {
      throw new MobileApiError(
        503,
        "logout_unavailable",
        "Unable to sign out right now.",
        30,
      );
    }
  },
};
