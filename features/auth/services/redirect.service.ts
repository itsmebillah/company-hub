import "server-only";

import { ROLE_NAMES } from "@/lib/auth/permissions";

const APP_DASHBOARD_PATH = "/dashboard";
const ADMIN_DASHBOARD_PATH = "/admin/dashboard";
const APP_TO_ADMIN_ROUTE_MAP = {
  "/announcements": "/admin/announcements",
  "/attendance": "/admin/attendance",
  "/calendar": "/admin/calendar",
  "/dashboard": ADMIN_DASHBOARD_PATH,
  "/leave": "/admin/leave/requests",
  "/profile": "/admin/profile",
  "/resources": "/admin/resources",
  "/settings": "/admin/settings",
} as const;

export function getPostLoginRedirectPath(roleName: string, isSystemAdmin = false) {
  if (isSystemAdmin) {
    return "/platform/dashboard";
  }
  if (roleName === ROLE_NAMES.companyAdmin) {
    return ADMIN_DASHBOARD_PATH;
  }

  return APP_DASHBOARD_PATH;
}

export function getAdminEquivalentPath(pathname: string) {
  return (
    APP_TO_ADMIN_ROUTE_MAP[pathname as keyof typeof APP_TO_ADMIN_ROUTE_MAP] ??
    ADMIN_DASHBOARD_PATH
  );
}
