"use server";

import { createHash } from "node:crypto";

import { loginWithEmployeeId } from "@/features/auth/services/login.service";
import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";

export type LoginActionState =
  | {
      ok: true;
      redirectTo: string;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

type LoginActionInput = {
  employeeId: string;
  password: string;
  rememberMe: boolean;
};

const FRIENDLY_ERRORS = {
  employeeIdRequired: "Employee ID is required.",
  passwordRequired: "Password is required.",
  notFound: "Employee account was not found.",
  inactive: "Employee account is inactive.",
  wrongPassword: "Employee ID or password is incorrect.",
  network: "Network error. Please try again.",
  unexpected: "Unable to sign in right now. Please try again.",
} as const;

export async function loginAction(
  input: LoginActionInput,
): Promise<LoginActionState> {
  const employeeId = input.employeeId.trim();
  const password = input.password.trim();

  if (!employeeId) {
    return { ok: false, message: FRIENDLY_ERRORS.employeeIdRequired };
  }

  if (!password) {
    return { ok: false, message: FRIENDLY_ERRORS.passwordRequired };
  }

  try {
    await loginWithEmployeeId({
      employeeId,
      password,
      rememberMe: input.rememberMe,
    });

    const profile = await getCurrentSessionProfile();

    if (!profile || profile.status !== "active") {
      return { ok: false, message: FRIENDLY_ERRORS.unexpected };
    }

    await PlatformAuditService.log({
      category: "login",
      action: "login_succeeded",
      entityType: "auth_session",
      status: "success",
      description: "User authentication succeeded.",
      companyId: profile.companyId,
      platformAdminId: profile.platformAdminId,
      metadata: { role: profile.roleName },
    });

    return {
      ok: true,
      message: "Login successful.",
      redirectTo: getPostLoginRedirectPath(
        profile.roleName,
        profile.isSystemAdmin,
      ),
    };
  } catch (error) {
    await PlatformAuditService.log({
      category: "login",
      action: "login_failed",
      entityType: "auth_session",
      status: "failure",
      description: "User authentication failed.",
      metadata: {
        identifierHash: createHash("sha256").update(employeeId).digest("hex"),
      },
    });
    if (!(error instanceof Error)) {
      return { ok: false, message: FRIENDLY_ERRORS.unexpected };
    }

    if (error.message === "Employee account was not found.") {
      return { ok: false, message: FRIENDLY_ERRORS.notFound };
    }

    if (error.message === "Employee account is not active.") {
      return { ok: false, message: FRIENDLY_ERRORS.inactive };
    }

    if (error.message === "Invalid employee ID or password.") {
      return { ok: false, message: FRIENDLY_ERRORS.wrongPassword };
    }

    if (error.message.toLowerCase().includes("fetch")) {
      return { ok: false, message: FRIENDLY_ERRORS.network };
    }

    return { ok: false, message: FRIENDLY_ERRORS.unexpected };
  }
}
