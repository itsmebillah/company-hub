import { updateCompanySettingsAction } from "@/features/company-settings/actions/company-settings.actions";
import { CompanySettingsForm } from "@/features/company-settings/components";
import { getCompanySettings } from "@/features/company-settings/services/company-settings.service";

export const dynamic = "force-dynamic";

export default async function AdminCompanyPage() {
  const settings = await getCompanySettings();

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Company Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the company branding, contact details, and default experience.
        </p>
      </div>

      <CompanySettingsForm
        initialValues={settings}
        onSave={updateCompanySettingsAction}
      />
    </section>
  );
}
