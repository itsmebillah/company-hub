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
import type { FeatureKey } from "@/features/platform-control/types/platform.types";

export type AppNavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  featureKey?: FeatureKey;
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
    featureKey: "announcements",
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: CalendarCheck,
    featureKey: "attendance",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    featureKey: "calendar",
  },
  {
    title: "Leave",
    href: "/leave",
    icon: ClipboardList,
    featureKey: "leave",
  },
  {
    title: "Resources",
    href: "/resources",
    icon: FolderKanban,
    featureKey: "resources",
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserRound,
    featureKey: "profile",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    featureKey: "company_settings",
  },
];

export const primaryMobileAppNavigationItems: AppNavigationItem[] = [
  appNavigationItems[0],
  appNavigationItems[2],
  appNavigationItems[4],
  appNavigationItems[5],
  appNavigationItems[6],
];
