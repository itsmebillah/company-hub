"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAllowedManagerRole } from "@/features/employees/constants/employee-rules";
import type {
  EmployeeActionState,
  EmployeeFormValues,
  EmployeeManagerOption,
  EmployeeRoleOption,
} from "@/features/employees/types/employee.types";
import type {
  EmployeeFormMode,
  EmployeeUiRecord,
} from "@/features/employees/ui/employee-management.types";

type EmployeeFormProps = {
  mode: EmployeeFormMode;
  employee?: EmployeeUiRecord | null;
  roles: EmployeeRoleOption[];
  managers: EmployeeManagerOption[];
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => Promise<EmployeeActionState>;
};

export function EmployeeForm({
  mode,
  employee,
  roles,
  managers,
  onClose,
  onSubmit,
}: EmployeeFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<EmployeeFormValues>({
    employeeId: employee?.employeeId ?? "",
    name: employee?.name ?? "",
    phone: employee?.phone ?? "",
    email: employee?.email ?? "",
    dateOfBirth: employee?.dateOfBirth ?? "",
    joiningDate: employee?.joiningDate ?? "",
    roleId: employee?.roleId ?? "",
    managerId: employee?.reportsToId ?? "",
    status: employee?.status ?? "active",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRole = roles.find((role) => role.id === values.roleId);
  const allowedManagerRole = selectedRole
    ? getAllowedManagerRole(selectedRole.name)
    : null;
  const managerOptions = useMemo(() => {
    if (!allowedManagerRole) {
      return [];
    }

    return managers.filter((manager) => manager.roleName === allowedManagerRole);
  }, [allowedManagerRole, managers]);

  function updateValue<Key extends keyof EmployeeFormValues>(
    key: Key,
    value: EmployeeFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "roleId" ? { managerId: "" } : {}),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const result = await onSubmit(values);

    if (!result.ok) {
      setIsSubmitting(false);
      setMessage(result.message);
      return;
    }

    onClose();

    if (result.redirectTo) {
      router.push(result.redirectTo);
      return;
    }

    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "Create Employee" : "Edit Employee"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "create" ? "Add an employee record." : "Update employee record."}
            </p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-sm font-medium">Employee ID</span>
            <input value={values.employeeId} onChange={(event) => updateValue("employeeId", event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Full Name</span>
            <input value={values.name} onChange={(event) => updateValue("name", event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Phone</span>
            <input value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Date of Birth</span>
            <input type="date" value={values.dateOfBirth} onChange={(event) => updateValue("dateOfBirth", event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Joining Date</span>
            <input type="date" value={values.joiningDate} onChange={(event) => updateValue("joiningDate", event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Role</span>
            <select value={values.roleId} onChange={(event) => updateValue("roleId", event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Select role</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Reports To</span>
            <select value={values.managerId} onChange={(event) => updateValue("managerId", event.target.value)} disabled={!allowedManagerRole} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
              <option value="">{allowedManagerRole ? `Select ${allowedManagerRole}` : "No reporting manager"}</option>
              {managerOptions.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Status</span>
            <select value={values.status} onChange={(event) => updateValue("status", event.target.value as EmployeeFormValues["status"])} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          {message ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{message}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t pt-4 md:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
