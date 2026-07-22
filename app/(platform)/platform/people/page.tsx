import Link from "next/link";

import { resetPlatformEmployeePasswordAction } from "@/features/platform-control/actions/platform-control.actions";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";
import { requireSystemAdminPage } from "@/features/platform-control/services/system-admin.service";

type Params = {
  page?: string;
  company?: string;
  role?: string;
  status?: string;
  search?: string;
};

export default async function PlatformPeoplePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireSystemAdminPage();
  const params = await searchParams;
  const filters = {
    page: Number(params.page) || 1,
    companyId: params.company,
    role: params.role,
    status: params.status,
    search: params.search,
  };
  const [people, options, systemAdmins] = await Promise.all([
    PlatformControlService.listPeople(filters),
    PlatformControlService.listPeopleFilterOptions(),
    PlatformControlService.listSystemAdmins(),
  ]);
  const totalPages = Math.max(1, Math.ceil(people.count / people.pageSize));
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(
      ([key, value]) => value && key !== "page" && query.set(key, value),
    );
    query.set("page", String(page));
    return `?${query}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-primary text-sm font-semibold">Global directory</p>
        <h1 className="text-2xl font-bold sm:text-3xl">People and admins</h1>
        <p className="text-muted-foreground mt-2">
          Cross-company visibility and audited credential recovery for System
          Admins. Internal Auth identities are never displayed.
        </p>
      </div>

      <section className="app-card p-4 sm:p-5">
        <h2 className="font-semibold">System Admins</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {systemAdmins.length ? (
            systemAdmins.map((admin) => (
              <span
                key={admin.id}
                className="bg-accent rounded-full px-3 py-1.5 text-sm"
              >
                {admin.display_name} · {admin.status}
              </span>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No permanent System Admin is provisioned.
            </p>
          )}
        </div>
      </section>

      <form className="app-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Employee ID or name"
          className="bg-background h-11 rounded-xl border px-3 lg:col-span-2"
        />
        <select
          name="company"
          defaultValue={params.company ?? ""}
          className="bg-background h-11 rounded-xl border px-3"
        >
          <option value="">All companies</option>
          {options.companies.map((company) => (
            <option key={company.id} value={company.id ?? ""}>
              {company.name}
            </option>
          ))}
        </select>
        <select
          name="role"
          defaultValue={params.role ?? ""}
          className="bg-background h-11 rounded-xl border px-3"
        >
          <option value="">All roles</option>
          {options.roles.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="bg-background h-11 rounded-xl border px-3"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
        <button className="bg-primary text-primary-foreground h-11 rounded-xl px-4 font-semibold sm:col-span-2 lg:col-span-1">
          Filter
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {people.items.map((employee) => (
          <article key={employee.id} className="app-card min-w-0 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{employee.name}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {employee.employeeId} · {employee.roleName}
                </p>
                <p className="text-muted-foreground mt-1 truncate text-xs">
                  {employee.companyName}
                </p>
              </div>
              <span className="bg-accent rounded-full px-2.5 py-1 text-xs font-semibold uppercase">
                {employee.status}
              </span>
            </div>
            {employee.canResetPassword ? (
              <form
                action={resetPlatformEmployeePasswordAction}
                className="mt-5 space-y-2"
              >
                <input type="hidden" name="employeeId" value={employee.id} />
                <label className="text-muted-foreground block text-xs font-semibold">
                  Type Employee ID to confirm reset
                  <input
                    name="confirmation"
                    required
                    autoComplete="off"
                    className="bg-background mt-1 h-10 w-full rounded-xl border px-3 text-sm"
                  />
                </label>
                <button className="min-h-11 w-full rounded-xl border px-3 text-sm font-semibold">
                  Reset initial password
                </button>
              </form>
            ) : (
              <p className="text-muted-foreground mt-5 text-xs">
                No linked Auth account.
              </p>
            )}
          </article>
        ))}
      </div>
      {!people.items.length ? (
        <p className="app-card text-muted-foreground p-8 text-center text-sm">
          No employees match these filters.
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-sm">
        <span>
          Page {people.page} of {totalPages} · {people.count} employees
        </span>
        <div className="flex gap-2">
          {people.page > 1 ? (
            <Link
              href={pageHref(people.page - 1)}
              className="rounded-xl border px-4 py-2 font-semibold"
            >
              Previous
            </Link>
          ) : null}
          {people.page < totalPages ? (
            <Link
              href={pageHref(people.page + 1)}
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
