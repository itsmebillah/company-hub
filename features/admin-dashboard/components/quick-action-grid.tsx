import { QuickActionCard } from "@/features/admin-dashboard/components/quick-action-card";
import { mobileDashboardQuickActions } from "@/features/admin-dashboard/constants/mobile-dashboard-config";
import type { FeatureKey } from "@/features/platform-control/types/platform.types";
import { getRouteFeature } from "@/features/platform-control/constants/feature-catalog";

export function QuickActionGrid({
  enabledFeatures,
}: {
  enabledFeatures?: Set<FeatureKey>;
}) {
  const actions = enabledFeatures
    ? mobileDashboardQuickActions.filter((action) => {
        const feature = getRouteFeature(action.href);
        return !feature || enabledFeatures.has(feature);
      })
    : mobileDashboardQuickActions;
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold sm:text-base">Admin Actions</h2>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {actions.map((action) => (
          <QuickActionCard key={action.href} {...action} />
        ))}
      </div>
    </section>
  );
}
