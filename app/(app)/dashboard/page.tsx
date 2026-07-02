import {
  AnnouncementTicker,
  EmployeePortalHeader,
  EmployeeResourcePortal,
  QuickResourceLinks,
} from "@/features/employee-resources/components";
import { EmployeeAnnouncementsPage } from "@/features/announcements/components";
import { AnnouncementService } from "@/features/announcements/services/announcement.service";
import { EmployeeResourceService } from "@/features/employee-resources/services/employee-resource.service";

export const dynamic = "force-dynamic";

const currentDate = new Intl.DateTimeFormat("en", {
  dateStyle: "full",
}).format(new Date());

export default async function DashboardPage() {
  const [data, announcements] = await Promise.all([
    EmployeeResourceService.getPortalData(),
    AnnouncementService.listForEmployee(),
  ]);

  return (
    <section className="space-y-6">
      <AnnouncementTicker announcements={announcements.announcements} />
      <EmployeePortalHeader
        profile={data.profile}
        currentDate={currentDate}
      />
      <QuickResourceLinks categories={data.categories} />
      <EmployeeResourcePortal data={data} />
      <EmployeeAnnouncementsPage result={announcements} />
    </section>
  );
}
