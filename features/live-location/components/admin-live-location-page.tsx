import Link from "next/link";
import { ExternalLink, LocateFixed } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { IconBadge } from "@/components/common/icon-badge";
import { PageHeader } from "@/components/common/page-header";
import type {
  AdminLiveLocation,
  AdminLiveLocationFreshness,
} from "@/features/live-location/types/admin-live-location.types";
import { formatAppDateTime } from "@/lib/datetime";

function freshnessLabel(value: AdminLiveLocationFreshness) {
  return value === "fresh" ? "Fresh" : value === "recent" ? "Recent" : "Stale";
}

function freshnessClass(value: AdminLiveLocationFreshness) {
  return value === "fresh"
    ? "bg-emerald-100 text-emerald-800"
    : value === "recent"
      ? "bg-amber-100 text-amber-800"
      : "bg-slate-100 text-slate-700";
}

function coordinates(location: AdminLiveLocation) {
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}

export function AdminLiveLocationPage({
  locations,
}: {
  locations: AdminLiveLocation[];
}) {
  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Attendance Tracking"
        title="Live Location"
        description="Latest saved location points for employees with an active duty-bound tracking record. Live means latest available, not continuous streaming."
        aside={<IconBadge icon={LocateFixed} className="mx-auto lg:mx-0" />}
      />
      {locations.length === 0 ? (
        <EmptyState
          title="No current locations available"
          description="Current employee locations will appear here after an authorized tracking point is received."
        />
      ) : (
        <div className="app-table-shell">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Latest point</th>
                  <th className="px-4 py-3 font-medium">Freshness</th>
                  <th className="px-4 py-3 font-medium">Accuracy</th>
                  <th className="px-4 py-3 font-medium">Coordinates</th>
                  <th className="px-4 py-3 font-medium">Map</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {locations.map((location) => (
                  <tr key={location.employeeId}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{location.employeeName}</p>
                      <p className="text-muted-foreground text-xs">
                        {location.employeeCode}
                      </p>
                    </td>
                    <td className="px-4 py-3">{location.roleName ?? "--"}</td>
                    <td className="px-4 py-3">
                      {formatAppDateTime(location.observedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <FreshnessBadge value={location.freshness} />
                    </td>
                    <td className="px-4 py-3">
                      {Math.round(location.accuracyMeters)}m
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {coordinates(location)}
                    </td>
                    <td className="px-4 py-3">
                      <MapLink location={location} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y lg:hidden">
            {locations.map((location) => (
              <article key={location.employeeId} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{location.employeeName}</h2>
                    <p className="text-muted-foreground text-sm">
                      {location.employeeCode}
                      {location.roleName ? ` · ${location.roleName}` : ""}
                    </p>
                  </div>
                  <FreshnessBadge value={location.freshness} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <Metric
                    label="Latest point"
                    value={formatAppDateTime(location.observedAt)}
                  />
                  <Metric
                    label="Accuracy"
                    value={`${Math.round(location.accuracyMeters)}m`}
                  />
                  <Metric label="Coordinates" value={coordinates(location)} />
                </dl>
                <MapLink location={location} />
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FreshnessBadge({ value }: { value: AdminLiveLocationFreshness }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${freshnessClass(value)}`}
    >
      {freshnessLabel(value)}
    </span>
  );
}

function MapLink({ location }: { location: AdminLiveLocation }) {
  return (
    <Link
      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
      target="_blank"
      rel="noreferrer noopener"
      className="hover:bg-muted inline-flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold"
    >
      <ExternalLink className="size-4" aria-hidden="true" />
      Open Map
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-lg border p-2">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
