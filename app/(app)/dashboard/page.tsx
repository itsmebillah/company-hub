import { redirect } from "next/navigation";

import {
  AnnouncementTicker,
  EmployeePortalHeader,
  QuickResourceLinks,
} from "@/features/employee-resources/components";
import { AnnouncementService } from "@/features/announcements/services/announcement.service";
import { AttendanceSummaryCard } from "@/features/attendance/components";
import { AttendanceService } from "@/features/attendance/services/attendance.service";
import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { TodaysCelebrationsCard } from "@/features/celebrations/components";
import type { CelebrationDashboardData } from "@/features/celebrations/types/celebration.types";
import { CelebrationService } from "@/features/celebrations/services/celebration.service";
import { EmployeeResourceService } from "@/features/employee-resources/services/employee-resource.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";
import { formatAppDate, getAppDateString } from "@/lib/datetime";

export const dynamic = "force-dynamic";

const EMPTY_CELEBRATIONS = {
  birthdays: [],
  workAnniversaries: [],
};

function filterCelebrationsForEmployee(
  celebrations: CelebrationDashboardData,
  employeeId: string,
): CelebrationDashboardData {
  return {
    birthdays: celebrations.birthdays.filter(
      (item) => item.employeeCode === employeeId,
    ),
    workAnniversaries: celebrations.workAnniversaries.filter(
      (item) => item.employeeCode === employeeId,
    ),
  };
}

export default async function DashboardPage() {
  const sessionProfile = await getCurrentSessionProfile();
  const currentDate = formatAppDate(new Date());
  const celebrationDateKey = getAppDateString();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.admin
  ) {
    redirect(getAdminEquivalentPath("/dashboard"));
  }

  const [data, announcements, attendanceSummary, celebrations] = await Promise.all([
    EmployeeResourceService.getPortalData(),
    AnnouncementService.listForEmployee(),
    AttendanceService.getEmployeeDashboardSummary(),
    CelebrationService.getEmployeeDashboardCelebrations().catch((error) => {
      console.error(
        "[DashboardPage] Unable to load employee celebrations.",
        error,
      );

      return EMPTY_CELEBRATIONS;
    }),
  ]);
  const employeeCelebrations = filterCelebrationsForEmployee(
    celebrations,
    data.profile.employeeId,
  );
  const hasEmployeeCelebration =
    employeeCelebrations.birthdays.length > 0 ||
    employeeCelebrations.workAnniversaries.length > 0;

  return (
    <section className="space-y-4 md:space-y-5">
      <EmployeePortalHeader
        profile={data.profile}
        currentDate={currentDate}
      />
      <AnnouncementTicker announcements={announcements.announcements} />
      <AttendanceSummaryCard summary={attendanceSummary} />
      {hasEmployeeCelebration ? (
        <TodaysCelebrationsCard
          celebrations={employeeCelebrations}
          dateKey={celebrationDateKey}
        />
      ) : null}
      <QuickResourceLinks categories={data.categories} />
    </section>
  );
}
