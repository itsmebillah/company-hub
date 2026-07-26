import { redirect } from "next/navigation";

import {
  EmployeePortalHeader,
  EmployeeResourcePortal,
} from "@/features/employee-resources/components";
import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { EmployeeResourceService } from "@/features/employee-resources/services/employee-resource.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

export const dynamic = "force-dynamic";

const currentDate = new Intl.DateTimeFormat("en", {
  dateStyle: "full",
}).format(new Date());

export default async function ResourcesPage() {
  const sessionProfile = await getCurrentSessionProfile();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.companyAdmin
  ) {
    redirect(getAdminEquivalentPath("/resources"));
  }

  const [data, features] = await Promise.all([
    EmployeeResourceService.getPortalData(),
    FeatureAccessService.getCurrentCompanyStates(),
  ]);
  const enabledFeatures = new Set(
    features
      .filter((feature) => feature.effectiveState === "enabled")
      .map((feature) => feature.key),
  );

  return (
    <section className="space-y-4 md:space-y-5">
      <EmployeePortalHeader profile={data.profile} currentDate={currentDate} />
      <EmployeeResourcePortal
        data={data}
        showQuickLinks={enabledFeatures.has("quick_links")}
        showKnowledge={
          enabledFeatures.has("knowledge_hub") ||
          enabledFeatures.has("resources")
        }
      />
    </section>
  );
}
