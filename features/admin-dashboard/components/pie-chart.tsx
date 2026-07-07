import type { DashboardPieSlice } from "@/features/admin-dashboard/types/dashboard.types";
import { ChartCard } from "@/features/admin-dashboard/components/chart-card";

type PieChartProps = {
  title: string;
  description: string;
  data: DashboardPieSlice[];
};

export function PieChart({ title, description, data }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const gradient = data
    .reduce<{ color: string; start: number; end: number }[]>((accumulator, item) => {
      const start = accumulator[accumulator.length - 1]?.end ?? 0;
      const end = total > 0 ? start + (item.value / total) * 100 : start;

      accumulator.push({ color: item.color, start, end });
      return accumulator;
    }, [])
    .map((item) => `${item.color} ${item.start}% ${item.end}%`)
    .join(", ");

  return (
    <ChartCard
      title={title}
      description={description}
      footer="Employee distribution is based on current record status."
    >
      {data.length > 0 ? (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div
            className="mx-auto size-40 rounded-full border"
            style={{
              background:
                total > 0
                  ? `conic-gradient(${gradient})`
                  : "conic-gradient(#e2e8f0 0% 100%)",
            }}
          />
          <div className="flex-1 space-y-3">
            {data.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No employee distribution is available yet.</p>
      )}
    </ChartCard>
  );
}
