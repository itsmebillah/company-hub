import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description: string;
  footer?: string;
  children: ReactNode;
};

export function ChartCard({
  title,
  description,
  footer,
  children,
}: ChartCardProps) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-5">{children}</div>

      {footer ? (
        <p className="mt-4 text-xs text-muted-foreground">{footer}</p>
      ) : null}
    </section>
  );
}
