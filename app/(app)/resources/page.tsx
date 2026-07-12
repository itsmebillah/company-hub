import { redirect } from "next/navigation";

import {
  EmployeePortalHeader,
  EmployeeResourcePortal,
} from "@/features/employee-resources/components";
import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { EmployeeResourceService } from "@/features/employee-resources/services/employee-resource.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const currentDate = new Intl.DateTimeFormat("en", {
  dateStyle: "full",
}).format(new Date());

export default async function ResourcesPage() {
  const sessionProfile = await getCurrentSessionProfile();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.admin
  ) {
    redirect(getAdminEquivalentPath("/resources"));
  }

  const data = await EmployeeResourceService.getPortalData();

  return (
    <section className="space-y-4 md:space-y-5">
      <EmployeePortalHeader
        profile={data.profile}
        currentDate={currentDate}
      />
      <EmployeeResourcePortal data={data} />
    </section>
  );
}
