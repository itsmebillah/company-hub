import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  MapPin,
  ShieldCheck,
  Settings,
  Users,
  Activity,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { FeatureKey } from "@/features/platform-control/types/platform.types";

export type AdminNavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  featureKey?: FeatureKey;
  featureKeys?: FeatureKey[];
};

export const adminNavigationItems: AdminNavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    href: "/admin/users",
    icon: Users,
    featureKey: "employee_directory",
  },
  {
    title: "Roles",
    href: "/admin/roles",
    icon: ShieldCheck,
    featureKey: "role_management",
  },
  {
    title: "Resources",
    href: "/admin/resources",
    icon: FolderKanban,
    featureKeys: ["resources", "quick_links", "knowledge_hub"],
  },
  {
    title: "Announcements",
    href: "/admin/announcements",
    icon: Bell,
    featureKey: "announcements",
  },
  {
    title: "Attendance",
    href: "/admin/attendance",
    icon: CalendarCheck,
    featureKey: "attendance",
  },
  {
    title: "Attendance Reports",
    href: "/admin/attendance/reports",
    icon: FileSpreadsheet,
    featureKey: "reports",
  },
  {
    title: "Calendar",
    href: "/admin/calendar",
    icon: CalendarDays,
    featureKey: "calendar",
  },
  {
    title: "Leave",
    href: "/admin/leave/requests",
    icon: ClipboardList,
    featureKey: "leave",
  },
  {
    title: "Leave Types",
    href: "/admin/leave/types",
    icon: ListChecks,
    featureKey: "leave",
  },
  {
    title: "Company",
    href: "/admin/company",
    icon: Building2,
    featureKey: "company_settings",
  },
  {
    title: "Locations",
    href: "/admin/company/locations",
    icon: MapPin,
    featureKey: "company_settings",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    featureKey: "company_settings",
  },
  {
    title: "Feature Controls",
    href: "/admin/settings/features",
    icon: SlidersHorizontal,
  },
  {
    title: "Audit Center",
    href: "/admin/audit",
    icon: Activity,
  },
];

export const adminNavigationFallback = {
  title: "Company Admin",
  href: "/admin/dashboard",
  icon: BarChart3,
} satisfies AdminNavigationItem;
