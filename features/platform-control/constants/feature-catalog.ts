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

export type RouteFeatureRule = {
  prefix: string;
  anyOf: readonly FeatureKey[];
};

const routeFeatureMap: RouteFeatureRule[] = [
  { prefix: "/admin/attendance/reports", anyOf: ["reports"] },
  { prefix: "/admin/attendance", anyOf: ["attendance"] },
  {
    prefix: "/admin/resources",
    anyOf: ["resources", "quick_links", "knowledge_hub"],
  },
  { prefix: "/admin/announcements", anyOf: ["announcements"] },
  { prefix: "/admin/leave", anyOf: ["leave"] },
  { prefix: "/admin/calendar", anyOf: ["calendar"] },
  { prefix: "/admin/users", anyOf: ["employee_directory"] },
  { prefix: "/admin/roles", anyOf: ["role_management"] },
  { prefix: "/admin/company", anyOf: ["company_settings"] },
  { prefix: "/admin/settings", anyOf: ["company_settings"] },
  { prefix: "/admin/profile", anyOf: ["profile"] },
  { prefix: "/attendance", anyOf: ["attendance"] },
  {
    prefix: "/resources",
    anyOf: ["resources", "quick_links", "knowledge_hub"],
  },
  { prefix: "/announcements", anyOf: ["announcements"] },
  { prefix: "/leave", anyOf: ["leave"] },
  { prefix: "/calendar", anyOf: ["calendar"] },
  { prefix: "/profile", anyOf: ["profile"] },
  { prefix: "/settings", anyOf: ["company_settings"] },
  { prefix: "/api/notifications", anyOf: ["notifications"] },
];

export function getRouteFeatureRule(pathname: string): RouteFeatureRule | null {
  if (pathname === "/admin/settings/features") {
    return null;
  }
  return (
    routeFeatureMap.find(
      ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ?? null
  );
}

export function getRouteFeature(pathname: string): FeatureKey | null {
  return getRouteFeatureRule(pathname)?.anyOf[0] ?? null;
}

export function isFeatureKey(value: string): value is FeatureKey {
  return FEATURE_KEYS.includes(value as FeatureKey);
}
