import {
  createCompanyAction,
  updateCompanyNameAction,
  updateCompanyStatusAction,
} from "@/features/platform-control/actions/platform-control.actions";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";
import { requireSystemAdminPage } from "@/features/platform-control/services/system-admin.service";

export default async function PlatformCompaniesPage() {
  await requireSystemAdminPage();
  const companies = await PlatformControlService.listCompanies();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Company management</h1>
        <p className="text-muted-foreground mt-2">
          Create companies and control platform access without deleting tenant
          data.
        </p>
      </div>
      <form
        action={createCompanyAction}
        className="app-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
      >
        <label className="flex-1 text-sm font-medium">
          Company name
          <input
            name="name"
            minLength={2}
            required
            className="bg-background mt-2 h-11 w-full rounded-2xl border px-4"
          />
        </label>
        <button className="bg-primary text-primary-foreground h-11 rounded-2xl px-5 font-semibold">
          Create company
        </button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <article key={company.id} className="app-card min-w-0 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{company.name}</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  {company.id}
                </p>
              </div>
              <span className="bg-accent rounded-full px-2.5 py-1 text-xs font-semibold uppercase">
                {company.platform_status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <strong className="block text-xl">
                  {company.employee_count ?? 0}
                </strong>
                Employees
              </div>
              <div>
                <strong className="block text-xl">
                  {company.admin_count ?? 0}
                </strong>
                Admins
              </div>
            </div>
            <form action={updateCompanyNameAction} className="mt-5 flex gap-2">
              <input type="hidden" name="companyId" value={company.id ?? ""} />
              <input
                name="name"
                defaultValue={company.name ?? ""}
                minLength={2}
                required
                aria-label="Company name"
                className="bg-background h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm"
              />
              <button className="rounded-xl border px-3 text-sm font-semibold">
                Rename
              </button>
            </form>
            <form
              action={updateCompanyStatusAction}
              className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2"
            >
              <input type="hidden" name="companyId" value={company.id ?? ""} />
              <select
                name="status"
                defaultValue={company.platform_status ?? "inactive"}
                className="bg-background h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="archived">Archived</option>
                <option value="deleted">Deleted</option>
              </select>
              <button className="rounded-xl border px-3 text-sm font-semibold">
                Update
              </button>
              <label className="text-muted-foreground col-span-2 text-xs">
                To select Deleted, type the exact company name
                <input
                  name="confirmation"
                  autoComplete="off"
                  className="bg-background mt-1 h-10 w-full rounded-xl border px-3 text-sm"
                />
              </label>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
