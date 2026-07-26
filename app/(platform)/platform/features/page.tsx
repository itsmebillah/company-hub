import {
  updateCompanyFeatureAction,
  updatePlatformFeatureAction,
} from "@/features/platform-control/actions/platform-control.actions";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";
import { requireSystemAdminPage } from "@/features/platform-control/services/system-admin.service";

export default async function PlatformFeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  await requireSystemAdminPage();
  const { company: companyId } = await searchParams;
  const [companies, result] = await Promise.all([
    PlatformControlService.listCompanies(),
    PlatformControlService.listFeatures(companyId),
  ]);
  const overrideMap = new Map(
    result.overrides.map((item) => [item.feature_key, item.company_state]),
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Feature management</h1>
        <p className="text-muted-foreground mt-2">
          Platform state is authoritative. Company overrides are available only
          when explicitly allowed.
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
          const summary = result.companySummaryByFeature.get(
            feature.feature_key,
          );
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
                  <p className="text-muted-foreground mt-1 text-xs">
                    {summary?.disabled_company_count ?? 0} companies disabled ·{" "}
                    {summary?.enabled_company_count ?? 0} explicitly enabled
                  </p>
                </div>
                <span className="bg-accent rounded-full px-2.5 py-1 text-xs font-semibold uppercase">
                  {feature.state}
                </span>
              </div>
              <form
                action={updatePlatformFeatureAction}
                className="mt-4 grid gap-3"
              >
                <input
                  type="hidden"
                  name="featureKey"
                  value={feature.feature_key}
                />
                <div className="flex gap-2">
                  <select
                    name="state"
                    defaultValue={
                      feature.state === "enabled" ? "enabled" : "disabled"
                    }
                    className="bg-background h-10 flex-1 rounded-xl border px-3 text-sm"
                  >
                    <option value="enabled">Platform enabled</option>
                    <option value="disabled">Platform disabled</option>
                  </select>
                  <button className="rounded-xl border px-3 text-sm font-semibold">
                    Save
                  </button>
                </div>
                <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="allowCompanyOverride"
                    defaultChecked={feature.allow_company_override}
                    className="size-4 w-auto"
                  />
                  Allow Company Admin override
                </label>
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
                    defaultValue={override ?? "inherit"}
                    disabled={
                      feature.state !== "enabled" ||
                      !feature.allow_company_override
                    }
                    className="bg-background h-10 flex-1 rounded-xl border px-3 text-sm disabled:opacity-50"
                  >
                    <option value="inherit">Inherit platform</option>
                    <option value="enabled">Company enabled</option>
                    <option value="disabled">Company disabled</option>
                  </select>
                  <button
                    disabled={
                      feature.state !== "enabled" ||
                      !feature.allow_company_override
                    }
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
