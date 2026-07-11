import { redirect } from "next/navigation";

import { AttendanceReportPage } from "@/features/attendance-reports/components/attendance-report-page";
import { AttendanceReportService } from "@/features/attendance-reports/services/attendance-report.service";
import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

type AttendanceReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AttendanceReportsPage({
  searchParams,
}: AttendanceReportsPageProps) {
  const profile = await getCurrentSessionProfile();

  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  if (![ROLE_NAMES.admin, "HR"].includes(profile.roleName)) {
    redirect(getPostLoginRedirectPath(profile.roleName));
  }

  const data = await AttendanceReportService.getPageData(await searchParams);

  if (!data) {
    redirect(getPostLoginRedirectPath(profile.roleName));
  }

  return <AttendanceReportPage data={data.pageData} />;
}
