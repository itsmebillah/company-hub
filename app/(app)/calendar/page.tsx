import { redirect } from "next/navigation";

import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { EmployeeCalendarPage } from "@/features/company-calendar/components";
import { CalendarService } from "@/features/company-calendar/services/calendar.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const sessionProfile = await getCurrentSessionProfile();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.admin
  ) {
    redirect(getAdminEquivalentPath("/calendar"));
  }

  const data = await CalendarService.getEmployeePageData();

  return <EmployeeCalendarPage data={data} />;
}
