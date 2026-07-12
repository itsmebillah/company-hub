"use client";

import { Cake, PartyPopper } from "lucide-react";

import {
  PremiumCard,
  PremiumIconContainer,
} from "@/components/common/premium-card";
import type { CelebrationDashboardData } from "@/features/celebrations/types/celebration.types";

type TodaysCelebrationsCardProps = {
  celebrations: CelebrationDashboardData;
};

function CelebrationList({
  icon: Icon,
  title,
  emptyLabel,
  items,
}: {
  icon: typeof Cake;
  title: string;
  emptyLabel: string;
  items: CelebrationDashboardData["birthdays"];
}) {
  return (
    <div className="rounded-2xl border border-white/30 bg-background/75 p-3">
      <div className="flex items-center gap-2">
        <PremiumIconContainer icon={Icon} className="size-8" iconClassName="size-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
      </div>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={`${item.eventType}-${item.employeeId}`}
              className="rounded-2xl border border-white/20 bg-card/80 px-3 py-2"
            >
              <p className="text-sm font-semibold">{item.employeeName}</p>
              <p className="text-xs text-muted-foreground">
                {item.eventType === "work_anniversary" && item.yearsCompleted
                  ? `${item.yearsCompleted} year${item.yearsCompleted === 1 ? "" : "s"}`
                  : item.employeeCode}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

export function TodaysCelebrationsCard({
  celebrations,
}: TodaysCelebrationsCardProps) {
  return (
    <PremiumCard tone="purple" className="p-4">
      <div className="flex items-center gap-3">
        <PremiumIconContainer icon={PartyPopper} className="size-10" />
        <div>
          <h2 className="text-base font-semibold">Today&apos;s Celebrations</h2>
          <p className="text-sm text-muted-foreground">
            Birthday and work anniversary milestones across your company.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CelebrationList
          icon={Cake}
          title="Birthdays"
          items={celebrations.birthdays}
          emptyLabel="No birthdays today."
        />
        <CelebrationList
          icon={PartyPopper}
          title="Work Anniversaries"
          items={celebrations.workAnniversaries}
          emptyLabel="No work anniversaries today."
        />
      </div>
    </PremiumCard>
  );
}
