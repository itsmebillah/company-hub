import { Cake, PartyPopper } from "lucide-react";

import {
  PremiumCard,
  PremiumIconContainer,
} from "@/components/common/premium-card";
import type { CelebrationDashboardData } from "@/features/celebrations/types/celebration.types";

type AdminCelebrationOverviewProps = {
  celebrations: CelebrationDashboardData;
};

function CelebrationNames({
  items,
  emptyLabel,
}: {
  items: CelebrationDashboardData["birthdays"];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={`${item.eventType}-${item.employeeId}`}
          className="rounded-full border border-white/20 bg-background/75 px-3 py-1 text-xs font-medium"
        >
          {item.employeeName}
        </span>
      ))}
    </div>
  );
}

export function AdminCelebrationOverview({
  celebrations,
}: AdminCelebrationOverviewProps) {
  return (
    <section className="grid gap-2 sm:grid-cols-2">
      <PremiumCard tone="pink" className="p-4">
        <div className="flex items-center gap-3">
          <PremiumIconContainer icon={Cake} className="size-10" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Today&apos;s Birthdays
            </p>
            <p className="text-2xl font-semibold">
              {celebrations.birthdays.length}
            </p>
          </div>
        </div>
        <CelebrationNames
          items={celebrations.birthdays}
          emptyLabel="No birthdays today."
        />
      </PremiumCard>

      <PremiumCard tone="purple" className="p-4">
        <div className="flex items-center gap-3">
          <PremiumIconContainer icon={PartyPopper} className="size-10" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Work Anniversaries
            </p>
            <p className="text-2xl font-semibold">
              {celebrations.workAnniversaries.length}
            </p>
          </div>
        </div>
        <CelebrationNames
          items={celebrations.workAnniversaries}
          emptyLabel="No work anniversaries today."
        />
      </PremiumCard>
    </section>
  );
}
