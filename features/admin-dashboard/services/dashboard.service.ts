import "server-only";

import { getSupabaseAdminEnv, getSupabaseEnv } from "@/lib/env";
import { getCompanySettings } from "@/features/company-settings/services/company-settings.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { listEmployees } from "@/features/employees/services/employee.service";
import {
  getResourceCategories,
  listResources,
} from "@/features/resources/services/resource.service";
import { AnnouncementService } from "@/features/announcements/services/announcement.service";
import { AttendanceService } from "@/features/attendance/services/attendance.service";
import type { DashboardData } from "@/features/admin-dashboard/types/dashboard.types";

function getEnvironmentHealth() {
  try {
    getSupabaseEnv();
    getSupabaseAdminEnv();
    return "healthy";
  } catch {
    return "error";
  }
}

function getEmptyDashboard(): DashboardData {
  return {
    companyName: "Company Hub",
    companyLogo: null,
    loggedInUserName: "Admin",
    counts: {
      employees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      archivedEmployees: 0,
      resources: 0,
      categories: 0,
      announcements: 0,
      presentToday: 0,
      lateToday: 0,
      checkedInToday: 0,
      notCheckedInToday: 0,
    },
    recentEmployees: [],
    recentAnnouncements: [],
    recentResources: [],
    health: {
      authentication: "error",
      database: "error",
      storage: "warning",
      environment: getEnvironmentHealth(),
    },
  };
}

export async function getAdminDashboardData(): Promise<DashboardData> {
  try {
    const [
      settings,
      session,
      allEmployees,
      activeEmployees,
      inactiveEmployees,
      archivedEmployees,
      resourcesResult,
      categories,
      announcementsResult,
      attendanceOverview,
    ] = await Promise.all([
      getCompanySettings(),
      getCurrentSessionProfile(),
      listEmployees({ page: 1, pageSize: 5 }),
      listEmployees({ status: "active", page: 1, pageSize: 1 }),
      listEmployees({ status: "inactive", page: 1, pageSize: 1 }),
      listEmployees({ status: "archived", page: 1, pageSize: 1 }),
      listResources({ sort: "created_at" }),
      getResourceCategories(),
      AnnouncementService.list({}),
      AttendanceService.getAdminOverview(),
    ]);
    const recentAnnouncements = [...announcementsResult.announcements]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        priority: announcement.priority,
        publishDate: announcement.publishFrom || announcement.createdAt,
      }));
    const recentResources = resourcesResult.resources
      .slice(0, 5)
      .map((resource) => ({
        id: resource.id,
        title: resource.title,
        categoryName: resource.categoryName,
        resourceType: resource.resourceType,
      }));

    return {
      companyName: settings.companyName,
      companyLogo: settings.logo || null,
      loggedInUserName: session?.name ?? "Admin",
      counts: {
        employees: allEmployees.total,
        activeEmployees: activeEmployees.total,
        inactiveEmployees: inactiveEmployees.total,
        archivedEmployees: archivedEmployees.total,
        resources: resourcesResult.resources.length,
        categories: categories.length,
        announcements: announcementsResult.announcements.length,
        presentToday: attendanceOverview.presentToday,
        lateToday: attendanceOverview.lateToday,
        checkedInToday: attendanceOverview.checkedInToday,
        notCheckedInToday: attendanceOverview.notCheckedInToday,
      },
      recentEmployees: allEmployees.employees.map((employee) => ({
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        roleName: employee.roleName,
        status: employee.status,
        joiningDate: employee.joiningDate,
      })),
      recentAnnouncements,
      recentResources,
      health: {
        authentication: session ? "healthy" : "warning",
        database: "healthy",
        storage: "warning",
        environment: getEnvironmentHealth(),
      },
    };
  } catch {
    return getEmptyDashboard();
  }
}

export const DashboardService = {
  getAdminDashboardData,
};
