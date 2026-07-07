import type { DashboardChartPoint } from "@/features/admin-dashboard/types/dashboard.types";
import { ChartCard } from "@/features/admin-dashboard/components/chart-card";

type LineChartProps = {
  title: string;
  description: string;
  data: DashboardChartPoint[];
  tone?: string;
};

function getLinePath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function LineChart({
  title,
  description,
  data,
  tone = "#2563eb",
}: LineChartProps) {
  const width = 320;
  const height = 160;
  const padding = 18;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => ({
    x: padding + stepX * index,
    y: height - padding - (item.value / maxValue) * (height - padding * 2),
  }));
  const path = points.length > 1 ? getLinePath(points) : "";

  return (
    <ChartCard
      title={title}
      description={description}
      footer="Based on real attendance records from the last 7 days."
    >
      {data.length > 0 ? (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
            <path
              d={`M ${padding} ${height - padding} H ${width - padding}`}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.18"
              strokeWidth="1"
            />
            {path ? (
              <path
                d={path}
                fill="none"
                stroke={tone}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {points.map((point, index) => (
              <circle
                key={data[index].label}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={tone}
              />
            ))}
          </svg>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground sm:grid-cols-7">
            {data.map((item) => (
              <div key={item.label} className="rounded-md bg-secondary/40 px-2 py-1 text-center">
                <p className="font-medium text-foreground">{item.value}</p>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No attendance trend is available yet.</p>
      )}
    </ChartCard>
  );
}
