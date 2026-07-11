import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

import {
  PremiumCard,
  PremiumIconContainer,
  type PremiumCardTone,
} from "@/components/common/premium-card";

type KPICardProps = {
  title: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "violet" | PremiumCardTone;
};

function normalizeTone(tone: KPICardProps["tone"]): PremiumCardTone {
  if (tone === "amber") {
    return "orange";
  }

  if (tone === "violet") {
    return "purple";
  }

  return tone ?? "blue";
}

export function KPICard({
  title,
  value,
  trend,
  icon: Icon,
  tone = "blue",
}: KPICardProps) {
  const cardTone = normalizeTone(tone);

  return (
    <PremiumCard
      tone={cardTone}
      className="p-5 transition-colors hover:border-primary/25"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <PremiumIconContainer icon={Icon} className="size-11" />
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <TrendingUp className="size-3.5 text-emerald-600" aria-hidden="true" />
        <span>{trend}</span>
      </div>
    </PremiumCard>
  );
}
