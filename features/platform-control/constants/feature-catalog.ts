import type { FeatureKey } from "@/features/platform-control/types/platform.types";

export const FEATURE_KEYS = [
  "attendance",
  "quick_links",
  "knowledge_hub",
  "resources",
  "announcements",
  "leave",
  "reports",
  "notifications",
  "calendar",
  "employee_directory",
  "profile",
  "company_settings",
  "role_management",
  "future_modules",
] as const satisfies readonly FeatureKey[];

const routeFeatureMap: Array<[string, FeatureKey]> = [
  ["/admin/attendance/reports", "reports"],
  ["/admin/attendance", "attendance"],
  ["/admin/resources", "resources"],
  ["/admin/announcements", "announcements"],
  ["/admin/leave", "leave"],
  ["/admin/calendar", "calendar"],
  ["/admin/users", "employee_directory"],
  ["/admin/roles", "role_management"],
  ["/admin/company", "company_settings"],
  ["/admin/settings", "company_settings"],
  ["/attendance", "attendance"],
  ["/resources", "resources"],
  ["/announcements", "announcements"],
  ["/leave", "leave"],
  ["/calendar", "calendar"],
  ["/profile", "profile"],
  ["/settings", "company_settings"],
  ["/api/notifications", "notifications"],
];

export function getRouteFeature(pathname: string): FeatureKey | null {
  if (pathname === "/admin/settings/features") {
    return null;
  }
  return (
    routeFeatureMap.find(
      ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )?.[1] ?? null
  );
}

export function isFeatureKey(value: string): value is FeatureKey {
  return FEATURE_KEYS.includes(value as FeatureKey);
}
