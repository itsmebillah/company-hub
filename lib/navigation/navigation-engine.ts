import type { FeatureKey } from "@/features/platform-control/types/platform.types";

export type NavigationRole = "system_admin" | "company_admin" | "employee";
export type NavigationGroupKey = "hub" | "updates" | "me" | "more";
export type NavigationIconKey =
  | "announcement"
  | "attendance"
  | "building"
  | "calendar"
  | "company"
  | "dashboard"
  | "feature"
  | "help"
  | "leave"
  | "live_location"
  | "notification"
  | "profile"
  | "quick_links"
  | "reports"
  | "resources"
  | "roles"
  | "settings"
  | "system_health"
  | "users";

export type NavigationDestination = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: NavigationIconKey;
  featureKey?: FeatureKey;
};

export type ResolvedNavigation = {
  role: NavigationRole;
  dashboardHref: string;
  groups: Record<NavigationGroupKey, NavigationDestination[]>;
};

const employeeGroups: ResolvedNavigation["groups"] = {
  hub: [
    {
      id: "knowledge-hub",
      label: "Knowledge Hub",
      description: "Company knowledge and role-based content",
      href: "/resources#knowledge-hub",
      icon: "resources",
      featureKey: "knowledge_hub",
    },
    {
      id: "quick-links",
      label: "Quick Links",
      description: "Launch company tools",
      href: "/resources#quick-links",
      icon: "quick_links",
      featureKey: "quick_links",
    },
    {
      id: "resources",
      label: "Resources",
      description: "Documents, training, and links",
      href: "/resources",
      icon: "resources",
      featureKey: "resources",
    },
  ],
  updates: [
    {
      id: "announcements",
      label: "Announcements",
      href: "/announcements",
      icon: "announcement",
      featureKey: "announcements",
    },
    {
      id: "notifications",
      label: "Notifications",
      href: "/announcements#notifications",
      icon: "notification",
      featureKey: "notifications",
    },
  ],
  me: [
    {
      id: "profile",
      label: "Profile",
      href: "/profile",
      icon: "profile",
      featureKey: "profile",
    },
    {
      id: "attendance",
      label: "Attendance",
      href: "/attendance",
      icon: "attendance",
      featureKey: "attendance",
    },
    {
      id: "leave",
      label: "Leave",
      href: "/leave",
      icon: "leave",
      featureKey: "leave",
    },
    {
      id: "settings",
      label: "Settings & Password",
      href: "/settings",
      icon: "settings",
      featureKey: "company_settings",
    },
  ],
  more: [
    {
      id: "more-attendance",
      label: "Attendance",
      href: "/attendance",
      icon: "attendance",
      featureKey: "attendance",
    },
    {
      id: "more-leave",
      label: "Leave",
      href: "/leave",
      icon: "leave",
      featureKey: "leave",
    },
    {
      id: "calendar",
      label: "Calendar",
      href: "/calendar",
      icon: "calendar",
      featureKey: "calendar",
    },
    {
      id: "more-quick-links",
      label: "Quick Links",
      href: "/resources#quick-links",
      icon: "quick_links",
      featureKey: "quick_links",
    },
    {
      id: "more-resources",
      label: "Resources",
      href: "/resources",
      icon: "resources",
      featureKey: "resources",
    },
    {
      id: "help",
      label: "Help",
      href: "/settings#help",
      icon: "help",
      featureKey: "company_settings",
    },
  ],
};

const companyAdminGroups: ResolvedNavigation["groups"] = {
  hub: [
    {
      id: "company-quick-links",
      label: "Quick Links",
      href: "/admin/resources",
      icon: "quick_links",
      featureKey: "quick_links",
    },
    {
      id: "company-resources",
      label: "Resources & Knowledge Hub",
      href: "/admin/resources",
      icon: "resources",
      featureKey: "resources",
    },
    {
      id: "resource-categories",
      label: "Resource Categories",
      href: "/admin/resources/categories",
      icon: "resources",
      featureKey: "resources",
    },
  ],
  updates: [
    {
      id: "company-announcements",
      label: "Announcements",
      href: "/admin/announcements",
      icon: "announcement",
      featureKey: "announcements",
    },
    {
      id: "company-notifications",
      label: "Notifications",
      href: "/admin/announcements#notifications",
      icon: "notification",
      featureKey: "notifications",
    },
  ],
  me: [
    {
      id: "company-profile",
      label: "Profile",
      href: "/admin/profile",
      icon: "profile",
      featureKey: "profile",
    },
    {
      id: "company-settings-personal",
      label: "Settings & Password",
      href: "/admin/settings",
      icon: "settings",
      featureKey: "company_settings",
    },
  ],
  more: [
    {
      id: "employees",
      label: "Employee Management",
      href: "/admin/users",
      icon: "users",
      featureKey: "employee_directory",
    },
    {
      id: "attendance-management",
      label: "Attendance Management",
      href: "/admin/attendance",
      icon: "attendance",
      featureKey: "attendance",
    },
    {
      id: "live-location",
      label: "Live Location",
      href: "/admin/live-location",
      icon: "live_location",
      featureKey: "attendance",
    },
    {
      id: "leave-management",
      label: "Leave Management",
      href: "/admin/leave/requests",
      icon: "leave",
      featureKey: "leave",
    },
    {
      id: "reports",
      label: "Reports",
      href: "/admin/attendance/reports",
      icon: "reports",
      featureKey: "reports",
    },
    {
      id: "roles",
      label: "Roles & Hierarchy",
      href: "/admin/roles",
      icon: "roles",
      featureKey: "role_management",
    },
    {
      id: "company-calendar",
      label: "Calendar",
      href: "/admin/calendar",
      icon: "calendar",
      featureKey: "calendar",
    },
    {
      id: "company-settings",
      label: "Company Settings",
      href: "/admin/settings",
      icon: "company",
      featureKey: "company_settings",
    },
    {
      id: "company-feature-controls",
      label: "Feature Controls",
      href: "/admin/settings/features",
      icon: "feature",
    },
  ],
};

const systemAdminGroups: ResolvedNavigation["groups"] = {
  hub: [
    {
      id: "platform-features-hub",
      label: "Platform Features",
      href: "/platform/features",
      icon: "feature",
    },
  ],
  updates: [],
  me: [
    {
      id: "platform-settings-personal",
      label: "Platform Settings",
      href: "/platform/settings",
      icon: "settings",
    },
  ],
  more: [
    {
      id: "platform-dashboard",
      label: "Platform Dashboard",
      href: "/platform/dashboard",
      icon: "dashboard",
    },
    {
      id: "platform-companies",
      label: "Companies",
      href: "/platform/companies",
      icon: "building",
    },
    {
      id: "platform-people",
      label: "People",
      href: "/platform/people",
      icon: "users",
    },
    {
      id: "platform-features",
      label: "Platform Features",
      href: "/platform/features",
      icon: "feature",
    },
    {
      id: "platform-settings",
      label: "Platform Settings",
      href: "/platform/settings",
      icon: "settings",
    },
    {
      id: "platform-health",
      label: "System Health",
      href: "/platform/dashboard#system-health",
      icon: "system_health",
    },
    {
      id: "platform-releases",
      label: "Release Management",
      href: "/platform/releases",
      icon: "announcement",
    },
  ],
};

const roleConfiguration: Record<
  NavigationRole,
  Pick<ResolvedNavigation, "dashboardHref" | "groups">
> = {
  employee: { dashboardHref: "/dashboard", groups: employeeGroups },
  company_admin: {
    dashboardHref: "/admin/dashboard",
    groups: companyAdminGroups,
  },
  system_admin: {
    dashboardHref: "/platform/dashboard",
    groups: systemAdminGroups,
  },
};

export function resolveNavigation(
  role: NavigationRole,
  enabledFeatures: readonly FeatureKey[] = [],
): ResolvedNavigation {
  const configuration = roleConfiguration[role];
  const enabled = new Set(enabledFeatures);
  const filterGroup = (items: NavigationDestination[]) =>
    items.filter((item) => !item.featureKey || enabled.has(item.featureKey));

  return {
    role,
    dashboardHref: configuration.dashboardHref,
    groups: {
      hub: filterGroup(configuration.groups.hub),
      updates: filterGroup(configuration.groups.updates),
      me: filterGroup(configuration.groups.me),
      more: filterGroup(configuration.groups.more),
    },
  };
}
