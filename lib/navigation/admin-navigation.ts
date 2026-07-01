import {
  BarChart3,
  Bell,
  Building2,
  FolderKanban,
  LayoutDashboard,
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
    title: "Company",
    href: "/admin/company",
    icon: Building2,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export const adminNavigationFallback = {
  title: "Admin",
  href: "/admin/dashboard",
  icon: BarChart3,
} satisfies AdminNavigationItem;
