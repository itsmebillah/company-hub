import { redirect } from "next/navigation";

import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { EmployeeAnnouncementsPage } from "@/features/announcements/components";
import { AnnouncementService } from "@/features/announcements/services/announcement.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const sessionProfile = await getCurrentSessionProfile();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.companyAdmin
  ) {
    redirect(getAdminEquivalentPath("/announcements"));
  }

  const result = await AnnouncementService.listForEmployee();

  return <EmployeeAnnouncementsPage result={result} />;
}
