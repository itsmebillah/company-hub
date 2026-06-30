import "server-only";

import { ROLE_NAMES } from "@/lib/auth/permissions";

const APP_DASHBOARD_PATH = "/app/dashboard";
const ADMIN_DASHBOARD_PATH = "/admin/dashboard";

export function getPostLoginRedirectPath(roleName: string) {
  if (roleName === ROLE_NAMES.admin) {
    return ADMIN_DASHBOARD_PATH;
  }

  return APP_DASHBOARD_PATH;
}
