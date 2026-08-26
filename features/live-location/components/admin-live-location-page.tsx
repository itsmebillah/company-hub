"use client";

import Link from "next/link";
import { Download, ExternalLink, LocateFixed, RefreshCw, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminLiveLocation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const filteredLocations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return locations;
    return locations.filter((location) =>
      [location.employeeName, location.employeeCode, location.roleName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [locations, query]);

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
        <>
          <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-64 flex-1 max-w-xl">
            <Search
              className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search employee, ID, or role"
              aria-label="Search employee locations"
              className="bg-background w-full rounded-lg border py-2.5 pl-9 pr-9 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear location search"
                className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded p-1"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        <button type="button" onClick={async () => { if (refreshing) return; setRefreshing(true); try { router.refresh(); } finally { setTimeout(() => setRefreshing(false), 400); } }} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
        <button type="button" onClick={() => downloadCsv(filteredLocations)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
          <Download className="size-4" aria-hidden="true" /> Export CSV
        </button>
          </div>
          {filteredLocations.length === 0 ? (
            <EmptyState
              title="No employees match your search"
              description="Try searching by employee name, employee ID, or role."
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
                {filteredLocations.map((location) => (
                  <tr key={location.employeeId}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{location.employeeName}</p>
                      <p className="text-muted-foreground text-xs">
                        {location.employeeCode}
                      </p>
                    </td>
                    <td className="px-4 py-3">{location.roleName ?? "--"}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setSelected(location)} className="text-left underline-offset-2 hover:underline">{formatAppDateTime(location.observedAt)}</button>
                    </td>
                    <td className="px-4 py-3">
                      <FreshnessBadge value={location.freshness} />
                    </td>
                    <td className="px-4 py-3">
                      {Math.round(location.accuracyMeters)}m
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <button type="button" onClick={() => setSelected(location)} className="font-mono text-xs underline-offset-2 hover:underline">{coordinates(location)}</button>
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
            {filteredLocations.map((location) => (
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
                <button type="button" onClick={() => setSelected(location)} className="text-left text-sm font-semibold underline-offset-2 hover:underline">Last known location details</button>
                <MapLink location={location} />
              </article>
            ))}
          </div>
        </div>
          )}
        </>
      )}
      {selected ? <LocationDetails location={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}

function LocationDetails({ location, onClose }: { location: AdminLiveLocation; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Last known location details" onClick={onClose}>
    <div className="bg-background w-full max-w-md space-y-4 rounded-xl border p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-muted-foreground text-xs uppercase">Last known location</p><h2 className="text-lg font-semibold">{location.employeeName}</h2><p className="text-muted-foreground text-sm">{location.employeeCode}{location.roleName ? ` · ${location.roleName}` : ""}</p></div><button type="button" onClick={onClose} className="rounded p-1 text-sm" aria-label="Close location details">✕</button></div>
      <dl className="grid grid-cols-2 gap-3 text-sm"><Metric label="Updated" value={formatAppDateTime(location.observedAt)} /><Metric label="Freshness" value={freshnessLabel(location.freshness)} /><Metric label="Accuracy" value={`${Math.round(location.accuracyMeters)}m`} /><Metric label="Coordinates" value={coordinates(location)} /></dl>
      <MapLink location={location} />
    </div>
  </div>;
}

function downloadCsv(locations: AdminLiveLocation[]) {
  const header = ["Employee Name", "Employee ID", "Role", "Latitude", "Longitude", "Accuracy", "Last Updated", "Freshness", "Open Map URL"];
  const rows = locations.map((location) => [location.employeeName, location.employeeCode, location.roleName ?? "", location.latitude, location.longitude, location.accuracyMeters, location.observedAt, location.freshness, `https://www.google.com/maps?q=${location.latitude},${location.longitude}`]);
  const escape = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "live-location.csv"; anchor.click(); URL.revokeObjectURL(url);
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
