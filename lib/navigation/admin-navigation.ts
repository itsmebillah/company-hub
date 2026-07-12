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
  MapPin,
  ShieldCheck,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
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
  },
  {
    title: "Roles",
    href: "/admin/roles",
    icon: ShieldCheck,
  },
  {
    title: "Resources",
    href: "/admin/resources",
    icon: FolderKanban,
  },
  {
    title: "Announcements",
    href: "/admin/announcements",
    icon: Bell,
  },
  {
    title: "Attendance",
    href: "/admin/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Attendance Reports",
    href: "/admin/attendance/reports",
    icon: FileSpreadsheet,
  },
  {
    title: "Calendar",
    href: "/admin/calendar",
    icon: CalendarDays,
  },
  {
    title: "Leave",
    href: "/admin/leave/requests",
    icon: ClipboardList,
  },
  {
    title: "Company",
    href: "/admin/company",
    icon: Building2,
  },
  {
    title: "Locations",
    href: "/admin/company/locations",
    icon: MapPin,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export const primaryAdminNavigationItems: AdminNavigationItem[] = [
  adminNavigationItems[0],
  adminNavigationItems[1],
  adminNavigationItems[5],
  {
    ...adminNavigationItems[4],
    title: "Notice",
  },
  adminNavigationItems[3],
];

export const adminNavigationFallback = {
  title: "Admin",
  href: "/admin/dashboard",
  icon: BarChart3,
} satisfies AdminNavigationItem;
