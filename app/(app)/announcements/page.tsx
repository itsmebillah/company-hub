import { EmployeeAnnouncementsPage } from "@/features/announcements/components";
import { AnnouncementService } from "@/features/announcements/services/announcement.service";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const result = await AnnouncementService.listForEmployee();

  return <EmployeeAnnouncementsPage result={result} />;
}
