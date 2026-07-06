import {
  AnnouncementTicker,
  EmployeePortalHeader,
  QuickResourceLinks,
} from "@/features/employee-resources/components";
import { AnnouncementService } from "@/features/announcements/services/announcement.service";
import { AttendanceSummaryCard } from "@/features/attendance/components";
import { AttendanceService } from "@/features/attendance/services/attendance.service";
import { EmployeeResourceService } from "@/features/employee-resources/services/employee-resource.service";

export const dynamic = "force-dynamic";

const currentDate = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date());

export default async function DashboardPage() {
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
