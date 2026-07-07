import {
  archiveCompanyLocationAction,
  createCompanyLocationAction,
  setDefaultCompanyLocationAction,
  updateCompanyLocationAction,
} from "@/features/company-locations/actions/company-location.actions";
import { CompanyLocationsPage } from "@/features/company-locations/components";
import { getCompanyLocationsPageData } from "@/features/company-locations/services/company-location.service";

export const dynamic = "force-dynamic";

export default async function AdminCompanyLocationsPage() {
  const data = await getCompanyLocationsPageData();

  return (
    <CompanyLocationsPage
      locations={data.locations}
      employees={data.employees}
      onCreate={createCompanyLocationAction}
      onUpdate={updateCompanyLocationAction}
      onArchive={archiveCompanyLocationAction}
      onSetDefault={setDefaultCompanyLocationAction}
    />
  );
}
