import type { LucideIcon } from "lucide-react";

import {
  PremiumCard,
  PremiumIconContainer,
  type PremiumCardTone,
} from "@/components/common/premium-card";

type CompactMetricItem = {
  title: string;
  value: number;
  icon: LucideIcon;
  tone: PremiumCardTone;
};

type CompactMetricGridProps = {
  title: string;
  items: CompactMetricItem[];
  variant?: "snapshot" | "pending";
};

export function CompactMetricGrid({
  title,
  items,
  variant = "snapshot",
}: CompactMetricGridProps) {
  const isPending = variant === "pending";

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold sm:text-base">{title}</h2>
      <div
        className={
          isPending
            ? "grid gap-2 sm:grid-cols-3"
            : "grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6"
        }
      >
        {items.map((item) =>
          isPending ? (
            <PendingMetricCard key={item.title} item={item} />
          ) : (
            <SnapshotMetricCard key={item.title} item={item} />
          ),
        )}
      </div>
    </section>
  );
}

function SnapshotMetricCard({ item }: { item: CompactMetricItem }) {
  const Icon = item.icon;

  return (
    <PremiumCard
      tone={item.tone}
      className="flex min-h-[5.4rem] items-center gap-2.5 p-3"
    >
      <PremiumIconContainer icon={Icon} className="size-10" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {item.title}
        </p>
        <p className="text-xl font-semibold leading-tight">{item.value}</p>
      </div>
    </PremiumCard>
  );
}

function PendingMetricCard({ item }: { item: CompactMetricItem }) {
  const Icon = item.icon;

  return (
    <PremiumCard
      tone={item.tone}
      className="flex min-h-[4.3rem] items-center justify-between gap-3 px-3 py-2.5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <PremiumIconContainer
          icon={Icon}
          className="size-9"
          iconClassName="size-[1.125rem]"
        />
        <p className="line-clamp-2 text-sm font-medium leading-4">
          {item.title}
        </p>
      </div>
      <span className="shrink-0 text-xl font-semibold">{item.value}</span>
    </PremiumCard>
  );
}
