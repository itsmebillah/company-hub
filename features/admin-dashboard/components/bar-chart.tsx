import type { DashboardChartPoint } from "@/features/admin-dashboard/types/dashboard.types";
import { ChartCard } from "@/features/admin-dashboard/components/chart-card";

type BarChartProps = {
  title: string;
  description: string;
  data: DashboardChartPoint[];
};

const barTones = ["bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-blue-500"];

export function BarChart({ title, description, data }: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <ChartCard
      title={title}
      description={description}
      footer="Leave metrics are calculated from current workflow data."
    >
      {data.length > 0 ? (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${barTones[index % barTones.length]}`}
                  style={{
                    width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No leave request data is available yet.</p>
      )}
    </ChartCard>
  );
}
