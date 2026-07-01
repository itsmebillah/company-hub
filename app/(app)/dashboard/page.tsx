import {
  EmployeePortalHeader,
  EmployeeResourcePortal,
} from "@/features/employee-resources/components";
import { EmployeeResourceService } from "@/features/employee-resources/services/employee-resource.service";

export const dynamic = "force-dynamic";

const currentDate = new Intl.DateTimeFormat("en", {
  dateStyle: "full",
}).format(new Date());

export default async function DashboardPage() {
  const data = await EmployeeResourceService.getPortalData();

  return (
    <section className="space-y-6">
      <EmployeePortalHeader
        profile={data.profile}
        currentDate={currentDate}
      />
      <EmployeeResourcePortal data={data} />
    </section>
  );
}
