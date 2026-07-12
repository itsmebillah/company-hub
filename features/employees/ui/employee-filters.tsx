import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EMPLOYEE_WORK_MODE_OPTIONS } from "@/features/employees/constants/employee-work-mode.config";
import type {
  EmployeeManagerOption,
  EmployeeRoleOption,
} from "@/features/employees/types/employee.types";

type EmployeeFiltersProps = {
  roles: EmployeeRoleOption[];
  managers: EmployeeManagerOption[];
  search: string;
  roleId: string;
  status: string;
  managerId: string;
  workMode: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReportsToChange: (value: string) => void;
  onWorkModeChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onReset: () => void;
};

export function EmployeeFilters({
  roles,
  managers,
  search,
  roleId,
  status,
  managerId,
  workMode,
  sort,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onReportsToChange,
  onWorkModeChange,
  onSortChange,
  onReset,
}: EmployeeFiltersProps) {
  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto]">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search employee"
          className="h-10 w-full rounded-md border bg-background pl-9 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <select
        value={roleId}
        onChange={(event) => onRoleChange(event.target.value)}
        className="h-10 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All roles</option>
        {roles.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className="h-10 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="archived">Archived</option>
      </select>
      <select
        value={managerId}
        onChange={(event) => onReportsToChange(event.target.value)}
        className="h-10 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All managers</option>
        {managers.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.employeeId})
          </option>
        ))}
      </select>
      <select
        value={workMode}
        onChange={(event) => onWorkModeChange(event.target.value)}
        className="h-10 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All work modes</option>
        {EMPLOYEE_WORK_MODE_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.icon} {item.label}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value)}
        className="h-10 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="newest">Newest</option>
        <option value="employee_id">Employee ID</option>
        <option value="name">Name</option>
        <option value="work_mode">Work Mode</option>
      </select>
      <Button type="button" variant="outline" className="h-10" onClick={onReset}>
        <RotateCcw className="size-4" aria-hidden="true" />
        Reset
      </Button>
    </div>
  );
}
