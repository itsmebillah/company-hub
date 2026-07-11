import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type AppNavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const appNavigationItems: AppNavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Announcements",
    href: "/announcements",
    icon: Bell,
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "Leave",
    href: "/leave",
    icon: ClipboardList,
  },
  {
    title: "Resources",
    href: "/resources",
    icon: FolderKanban,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserRound,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const primaryMobileAppNavigationItems: AppNavigationItem[] = [
  appNavigationItems[0],
  appNavigationItems[2],
  appNavigationItems[4],
  appNavigationItems[5],
  appNavigationItems[6],
];
