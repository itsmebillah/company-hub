import type { LucideIcon } from "lucide-react";

import {
  PremiumCard,
  PremiumIconContainer,
} from "@/components/common/premium-card";

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
};

export function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <PremiumCard tone="blue" className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <PremiumIconContainer icon={Icon} className="size-10" />
      </div>
    </PremiumCard>
  );
}
