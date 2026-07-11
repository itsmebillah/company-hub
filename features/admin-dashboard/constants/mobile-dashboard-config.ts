import {
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart,
  FileClock,
  FileSpreadsheet,
  FolderPlus,
  Megaphone,
  Settings,
  Users,
  UsersRound,
  UserX,
} from "lucide-react";

import type { DashboardData } from "@/features/admin-dashboard/types/dashboard.types";

export const mobileDashboardQuickActions = [
  {
    title: "Create Employee",
    href: "/admin/users/new",
    icon: Users,
    tone: "blue" as const,
  },
  {
    title: "Create Notice",
    href: "/admin/announcements",
    icon: Megaphone,
    tone: "orange" as const,
  },
  {
    title: "Create Resource",
    href: "/admin/resources",
    icon: FolderPlus,
    tone: "cyan" as const,
  },
  {
    title: "Manage Roles",
    href: "/admin/roles",
    icon: UsersRound,
    tone: "purple" as const,
  },
  {
    title: "Company",
    href: "/admin/company",
    icon: Building2,
    tone: "gray" as const,
  },
  {
    title: "Reports",
    href: "/admin/attendance/reports",
    icon: FileBarChart,
    tone: "purple" as const,
  },
  {
    title: "Import",
    href: "/admin/users/import",
    icon: FileSpreadsheet,
    tone: "green" as const,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    tone: "gray" as const,
  },
];

export function getCompanySnapshotItems(counts: DashboardData["counts"]) {
  return [
    {
      title: "Present",
      value: counts.presentToday,
      icon: CheckCircle2,
      tone: "green" as const,
    },
    {
      title: "Absent",
      value: counts.absentToday,
      icon: UserX,
      tone: "pink" as const,
    },
    {
      title: "Leave",
      value: counts.employeesOnLeaveToday,
      icon: CalendarClock,
      tone: "blue" as const,
    },
    {
      title: "Late",
      value: counts.lateToday,
      icon: CalendarClock,
      tone: "orange" as const,
    },
    {
      title: "Pending",
      value: counts.pendingLeaveRequests,
      icon: FileClock,
      tone: "purple" as const,
    },
    {
      title: "Alerts",
      value: counts.unreadNotifications,
      icon: Bell,
      tone: "gray" as const,
    },
  ];
}

export function getPendingWorkItems(counts: DashboardData["counts"]) {
  return [
    {
      title: "Pending Leave",
      value: counts.pendingLeaveRequests,
      icon: FileClock,
      tone: "purple" as const,
    },
    {
      title: "Attendance Gaps",
      value: counts.absentToday,
      icon: ClipboardCheck,
      tone: "orange" as const,
    },
    {
      title: "Unread Notifications",
      value: counts.unreadNotifications,
      icon: Bell,
      tone: "blue" as const,
    },
  ];
}
