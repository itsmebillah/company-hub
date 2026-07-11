import type { LucideIcon } from "lucide-react";

type CompactMetricItem = {
  title: string;
  value: number;
  icon: LucideIcon;
  tone: string;
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
    <div className="flex min-h-[5.4rem] items-center gap-2.5 rounded-[1.25rem] border bg-card/95 p-3 shadow-[var(--shadow-soft)]">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {item.title}
        </p>
        <p className="text-xl font-semibold leading-tight">{item.value}</p>
      </div>
    </div>
  );
}

function PendingMetricCard({ item }: { item: CompactMetricItem }) {
  const Icon = item.icon;

  return (
    <div className="flex min-h-[4.3rem] items-center justify-between gap-3 rounded-[1.25rem] border bg-card/95 px-3 py-2.5 shadow-[var(--shadow-soft)]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}
        >
          <Icon className="size-[1.125rem]" aria-hidden="true" />
        </span>
        <p className="line-clamp-2 text-sm font-medium leading-4">
          {item.title}
        </p>
      </div>
      <span className="shrink-0 text-xl font-semibold">{item.value}</span>
    </div>
  );
}
