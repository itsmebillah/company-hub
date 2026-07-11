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
import { EmployeeResourceService } from "@/features/employee-resources/services/employee-resource.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const currentDate = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date());

export default async function DashboardPage() {
  const sessionProfile = await getCurrentSessionProfile();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.admin
  ) {
    redirect(getAdminEquivalentPath("/dashboard"));
  }

  const [data, announcements, attendanceSummary] = await Promise.all([
    EmployeeResourceService.getPortalData(),
    AnnouncementService.listForEmployee(),
    AttendanceService.getEmployeeDashboardSummary(),
  ]);

  return (
    <section className="space-y-4 md:space-y-5">
      <EmployeePortalHeader
        profile={data.profile}
        currentDate={currentDate}
      />
      <AnnouncementTicker announcements={announcements.announcements} />
      <AttendanceSummaryCard summary={attendanceSummary} />
      <QuickResourceLinks categories={data.categories} />
    </section>
  );
}
