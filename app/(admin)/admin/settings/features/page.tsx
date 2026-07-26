import { updateOwnCompanyFeatureAction } from "@/features/platform-control/actions/platform-control.actions";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

export default async function CompanyFeatureSettingsPage() {
  const features = await FeatureAccessService.getCurrentCompanyStates();
  const visibleFeatures = features.filter(
    (feature) => feature.state === "enabled",
  );
  return (
    <div className="space-y-5">
      <div>
        <p className="text-primary text-sm font-semibold">Company settings</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Feature controls</h1>
        <p className="text-muted-foreground mt-2">
          Choose inherit, enabled, or disabled where the platform permits a
          company override. Platform decisions always win.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {visibleFeatures.map((feature) => (
          <article key={feature.key} className="app-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{feature.name}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {feature.description}
                </p>
              </div>
              <span className="bg-accent rounded-full px-2.5 py-1 text-xs font-semibold uppercase">
                {feature.effectiveState}
              </span>
            </div>
            <form
              action={updateOwnCompanyFeatureAction}
              className="mt-4 flex gap-2"
            >
              <input type="hidden" name="featureKey" value={feature.key} />
              <select
                name="state"
                defaultValue={feature.companyState}
                disabled={!feature.companyConfigurable}
                className="bg-background h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm"
              >
                <option value="inherit">Inherit platform</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
              <button
                disabled={!feature.companyConfigurable}
                className="rounded-xl border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </form>
            {!feature.companyConfigurable ? (
              <p className="text-muted-foreground mt-3 text-xs font-medium">
                Read only · controlled by System Admin
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
