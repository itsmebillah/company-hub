import type { DashboardChartPoint } from "@/features/admin-dashboard/types/dashboard.types";
import { ChartCard } from "@/features/admin-dashboard/components/chart-card";

type AreaChartProps = {
  title: string;
  description: string;
  data: DashboardChartPoint[];
  tone?: string;
};

function getLinePath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function AreaChart({
  title,
  description,
  data,
  tone = "#0f766e",
}: AreaChartProps) {
  const width = 320;
  const height = 160;
  const padding = 18;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => ({
    x: padding + stepX * index,
    y: height - padding - (item.value / maxValue) * (height - padding * 2),
  }));
  const linePath = points.length > 1 ? getLinePath(points) : "";
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

  return (
    <ChartCard
      title={title}
      description={description}
      footer="Shows logged operational changes across core company modules."
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
            {areaPath ? <path d={areaPath} fill={tone} fillOpacity="0.18" /> : null}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke={tone}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </svg>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.map((item) => (
              <span
                key={item.label}
                className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground"
              >
                {item.label}: <span className="font-medium text-foreground">{item.value}</span>
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No activity log trend is available yet.</p>
      )}
    </ChartCard>
  );
}
