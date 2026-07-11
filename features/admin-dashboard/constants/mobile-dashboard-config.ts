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
    tone: "green" as const,
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
    tone: "slate" as const,
  },
  {
    title: "Reports",
    href: "/admin/attendance/reports",
    icon: FileBarChart,
    tone: "red" as const,
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
    tone: "slate" as const,
  },
];

export function getCompanySnapshotItems(counts: DashboardData["counts"]) {
  return [
    {
      title: "Present",
      value: counts.presentToday,
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      title: "Absent",
      value: counts.absentToday,
      icon: UserX,
      tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      title: "Leave",
      value: counts.employeesOnLeaveToday,
      icon: CalendarClock,
      tone: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300",
    },
    {
      title: "Late",
      value: counts.lateToday,
      icon: CalendarClock,
      tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      title: "Pending",
      value: counts.pendingLeaveRequests,
      icon: FileClock,
      tone: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      title: "Alerts",
      value: counts.unreadNotifications,
      icon: Bell,
      tone: "text-slate-700 bg-slate-100 dark:bg-slate-900/70 dark:text-slate-300",
    },
  ];
}

export function getPendingWorkItems(counts: DashboardData["counts"]) {
  return [
    {
      title: "Pending Leave",
      value: counts.pendingLeaveRequests,
      icon: FileClock,
      tone: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      title: "Attendance Gaps",
      value: counts.absentToday,
      icon: ClipboardCheck,
      tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      title: "Unread Notifications",
      value: counts.unreadNotifications,
      icon: Bell,
      tone: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    },
  ];
}
