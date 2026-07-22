import Link from "next/link";
import { FEATURE_KEYS } from "@/features/platform-control/constants/feature-catalog";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";
import { requireSystemAdminPage } from "@/features/platform-control/services/system-admin.service";
import type {
  AuditCategory,
  FeatureKey,
} from "@/features/platform-control/types/platform.types";

type Params = {
  page?: string;
  company?: string;
  category?: string;
  feature?: string;
  status?: string;
  search?: string;
  employee?: string;
  role?: string;
  action?: string;
  from?: string;
  to?: string;
};
const categories: AuditCategory[] = [
  "audit",
  "activity",
  "login",
  "security",
  "feature_usage",
  "error",
];

export default async function PlatformAuditPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireSystemAdminPage();
  const params = await searchParams;
  const filters = {
    page: Number(params.page) || 1,
    companyId: params.company,
    category: categories.includes(params.category as AuditCategory)
      ? (params.category as AuditCategory)
      : undefined,
    featureKey: FEATURE_KEYS.includes(params.feature as FeatureKey)
      ? (params.feature as FeatureKey)
      : undefined,
    status: params.status,
    search: params.search,
    employee: params.employee,
    role: params.role,
    action: params.action,
    fromDate: params.from,
    toDate: params.to,
  };
  const [logs, companies] = await Promise.all([
    PlatformControlService.listAuditLogs(filters),
    PlatformControlService.listCompanies(),
  ]);
  const companyMap = new Map(
    companies.map((company) => [company.id, company.name]),
  );
  const totalPages = Math.max(1, Math.ceil(logs.count / logs.pageSize));
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(
      ([key, value]) => value && key !== "page" && query.set(key, value),
    );
    query.set("page", String(page));
    return `?${query}`;
  };
  const exportHref = (format: "csv" | "xlsx") => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(
      ([key, value]) => value && key !== "page" && query.set(key, value),
    );
    query.set("format", format);
    return `/platform/audit/export?${query}`;
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Audit center</h1>
        <p className="text-muted-foreground mt-2">
          Centralized login, security, activity, feature usage, and error
          events.
        </p>
      </div>
      <form className="app-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Search events"
          className="bg-background h-11 rounded-xl border px-3 lg:col-span-2"
        />
        <select
          name="company"
          defaultValue={params.company ?? ""}
          className="bg-background h-11 rounded-xl border px-3"
        >
          <option value="">All companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id ?? ""}>
              {company.name}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="bg-background h-11 rounded-xl border px-3"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <select
          name="feature"
          defaultValue={params.feature ?? ""}
          className="bg-background h-11 rounded-xl border px-3"
        >
          <option value="">All features</option>
          {FEATURE_KEYS.map((feature) => (
            <option key={feature}>{feature}</option>
          ))}
        </select>
        <input
          name="employee"
          defaultValue={params.employee}
          placeholder="Employee ID or name"
          className="bg-background h-11 rounded-xl border px-3"
        />
        <input
          name="role"
          defaultValue={params.role}
          placeholder="Role"
          className="bg-background h-11 rounded-xl border px-3"
        />
        <input
          name="action"
          defaultValue={params.action}
          placeholder="Action / event"
          className="bg-background h-11 rounded-xl border px-3"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="bg-background h-11 rounded-xl border px-3"
        >
          <option value="">All statuses</option>
          {["success", "failure", "denied", "warning"].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <label className="text-muted-foreground text-xs font-semibold">
          From
          <input
            type="date"
            name="from"
            defaultValue={params.from}
            className="bg-background mt-1 h-11 w-full rounded-xl border px-3 text-sm"
          />
        </label>
        <label className="text-muted-foreground text-xs font-semibold">
          To
          <input
            type="date"
            name="to"
            defaultValue={params.to}
            className="bg-background mt-1 h-11 w-full rounded-xl border px-3 text-sm"
          />
        </label>
        <button className="bg-primary text-primary-foreground h-11 rounded-xl px-4 font-semibold">
          Filter
        </button>
      </form>
      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href={exportHref("csv")}
          className="rounded-xl border px-4 py-2 text-sm font-semibold"
        >
          Export CSV
        </Link>
        <Link
          href={exportHref("xlsx")}
          className="rounded-xl border px-4 py-2 text-sm font-semibold"
        >
          Export Excel
        </Link>
      </div>
      <div className="app-card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {[
                "Time",
                "Employee / role",
                "Category",
                "Event",
                "Company",
                "Feature",
                "Status",
              ].map((item) => (
                <th key={item} className="px-4 py-3 font-semibold">
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.items.map((event) => (
              <tr key={event.id}>
                <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                  {new Date(event.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {event.actorName ? (
                    <>
                      <strong className="block">{event.actorName}</strong>
                      <span className="text-muted-foreground text-xs">
                        {event.actorEmployeeId} ·{" "}
                        {event.actorRole ?? "No active role"}
                      </span>
                    </>
                  ) : (
                    "System"
                  )}
                </td>
                <td className="px-4 py-3">{event.category}</td>
                <td className="max-w-sm px-4 py-3">
                  <strong className="block">{event.action}</strong>
                  <span className="text-muted-foreground">
                    {event.description}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {companyMap.get(event.company_id) ?? "Platform"}
                </td>
                <td className="px-4 py-3">{event.feature_key ?? "—"}</td>
                <td className="px-4 py-3 uppercase">{event.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.items.length ? (
          <p className="text-muted-foreground p-8 text-center text-sm">
            No events match these filters.
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>
          Page {logs.page} of {totalPages} · {logs.count} events
        </span>
        <div className="flex gap-2">
          {logs.page > 1 ? (
            <Link
              href={pageHref(logs.page - 1)}
              className="rounded-xl border px-4 py-2 font-semibold"
            >
              Previous
            </Link>
          ) : null}
          {logs.page < totalPages ? (
            <Link
              href={pageHref(logs.page + 1)}
              className="rounded-xl border px-4 py-2 font-semibold"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
