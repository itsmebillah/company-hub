import {
  updateCompanyFeatureAction,
  updatePlatformFeatureAction,
} from "@/features/platform-control/actions/platform-control.actions";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";

export default async function PlatformFeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: companyId } = await searchParams;
  const [companies, result] = await Promise.all([
    PlatformControlService.listCompanies(),
    PlatformControlService.listFeatures(companyId),
  ]);
  const overrideMap = new Map(
    result.overrides.map((item) => [item.feature_key, item.state]),
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Feature management</h1>
        <p className="text-muted-foreground mt-2">
          Platform state is authoritative. Company overrides can only narrow
          access.
        </p>
      </div>
      <form className="app-card p-4">
        <label className="text-sm font-medium">
          Inspect company override
          <select
            name="company"
            defaultValue={companyId ?? ""}
            className="bg-background mt-2 h-11 w-full rounded-2xl border px-3"
            onChange={undefined}
          >
            <option value="">Platform defaults only</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id ?? ""}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <button className="mt-3 h-10 rounded-xl border px-4 text-sm font-semibold">
          Load company
        </button>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        {result.features.map((feature) => {
          const override = overrideMap.get(feature.feature_key);
          return (
            <article key={feature.feature_key} className="app-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{feature.display_name}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {feature.description}
                  </p>
                  <p className="text-primary mt-2 text-xs font-semibold">
                    {result.usageByFeature.get(feature.feature_key) ?? 0}{" "}
                    requests in 30 days
                  </p>
                </div>
                <span className="bg-accent rounded-full px-2.5 py-1 text-xs font-semibold uppercase">
                  {feature.state}
                </span>
              </div>
              <form
                action={updatePlatformFeatureAction}
                className="mt-4 flex gap-2"
              >
                <input
                  type="hidden"
                  name="featureKey"
                  value={feature.feature_key}
                />
                <select
                  name="state"
                  defaultValue={
                    feature.state === "enabled" ? "enabled" : "disabled"
                  }
                  className="bg-background h-10 flex-1 rounded-xl border px-3 text-sm"
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
                <button className="rounded-xl border px-3 text-sm font-semibold">
                  Platform
                </button>
              </form>
              {companyId ? (
                <form
                  action={updateCompanyFeatureAction}
                  className="mt-2 flex gap-2"
                >
                  <input type="hidden" name="companyId" value={companyId} />
                  <input
                    type="hidden"
                    name="featureKey"
                    value={feature.feature_key}
                  />
                  <select
                    name="state"
                    defaultValue={
                      override === "disabled" ? "disabled" : "enabled"
                    }
                    disabled={feature.state !== "enabled"}
                    className="bg-background h-10 flex-1 rounded-xl border px-3 text-sm disabled:opacity-50"
                  >
                    <option value="enabled">Company enabled</option>
                    <option value="disabled">Company disabled</option>
                  </select>
                  <button
                    disabled={feature.state !== "enabled"}
                    className="rounded-xl border px-3 text-sm font-semibold disabled:opacity-50"
                  >
                    Company
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
