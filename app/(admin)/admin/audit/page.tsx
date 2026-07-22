import Link from "next/link";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";

export default async function CompanyAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const logs = await PlatformControlService.listOwnCompanyAuditLogs(
    Number(params.page) || 1,
  );
  const totalPages = Math.max(1, Math.ceil(logs.count / logs.pageSize));
  return (
    <div className="space-y-5">
      <div>
        <p className="text-primary text-sm font-semibold">
          Company administration
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">Audit center</h1>
        <p className="text-muted-foreground mt-2">
          Security and activity history for your company only.
        </p>
      </div>
      <div className="app-card overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {["Time", "Category", "Event", "Feature", "Status"].map(
                (item) => (
                  <th key={item} className="px-4 py-3">
                    {item}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.items.map((event) => (
              <tr key={event.id}>
                <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                  {new Date(event.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{event.category}</td>
                <td className="px-4 py-3">
                  <strong className="block">{event.action}</strong>
                  <span className="text-muted-foreground">
                    {event.description}
                  </span>
                </td>
                <td className="px-4 py-3">{event.feature_key ?? "—"}</td>
                <td className="px-4 py-3 uppercase">{event.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.items.length ? (
          <p className="text-muted-foreground p-8 text-center">
            No company events recorded yet.
          </p>
        ) : null}
      </div>
      <div className="flex justify-between text-sm">
        <span>
          Page {logs.page} of {totalPages}
        </span>
        <div className="flex gap-2">
          {logs.page > 1 ? (
            <Link
              href={`?page=${logs.page - 1}`}
              className="rounded-xl border px-3 py-2"
            >
              Previous
            </Link>
          ) : null}
          {logs.page < totalPages ? (
            <Link
              href={`?page=${logs.page + 1}`}
              className="rounded-xl border px-3 py-2"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
