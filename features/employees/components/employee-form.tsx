"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAllowedManagerRole } from "@/features/employees/constants/employee-rules";
import type {
  EmployeeActionState,
  EmployeeFormValues,
  EmployeeManagerOption,
  EmployeeRoleOption,
} from "@/features/employees/types/employee.types";
import { cn } from "@/lib/utils";

type EmployeeFormProps = {
  roles: EmployeeRoleOption[];
  managers: EmployeeManagerOption[];
  initialValues?: EmployeeFormValues;
  submitLabel: string;
  onSubmit: (values: EmployeeFormValues) => Promise<EmployeeActionState>;
};

const defaultValues: EmployeeFormValues = {
  employeeId: "",
  name: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  joiningDate: "",
  roleId: "",
  managerId: "",
  status: "active",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function EmployeeForm({
  roles,
  managers,
  initialValues,
  submitLabel,
  onSubmit,
}: EmployeeFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<EmployeeFormValues>(
    initialValues ?? defaultValues,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormValues, string>>>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(initialValues);

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
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (key === "roleId") {
        next.managerId = "";
      }

      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors: Partial<Record<keyof EmployeeFormValues, string>> = {};

    if (!values.employeeId.trim()) nextErrors.employeeId = "Employee ID is required.";
    if (!values.name.trim()) nextErrors.name = "Full name is required.";
    if (!values.phone.trim()) nextErrors.phone = "Phone is required.";
    if (!values.dateOfBirth) nextErrors.dateOfBirth = "Date of birth is required.";
    if (!values.joiningDate) nextErrors.joiningDate = "Joining date is required.";
    if (!values.roleId) nextErrors.roleId = "Role is required.";
    if (allowedManagerRole && !values.managerId) {
      nextErrors.managerId = `Reports To must be ${allowedManagerRole}.`;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("Please complete the required fields.");
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

    if (result.redirectTo) {
      router.replace(result.redirectTo);
    } else {
      setIsSubmitting(false);
      setMessage(result.message);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Employee ID</span>
          <input
            value={values.employeeId}
            onChange={(event) => updateValue("employeeId", event.target.value)}
            className={cn("h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring", errors.employeeId && "border-destructive")}
            placeholder="EMP001"
            disabled={isSubmitting || isEditMode}
          />
          {isEditMode ? (
            <p className="text-xs text-muted-foreground">
              Employee ID is the login ID and cannot be changed.
            </p>
          ) : null}
          <FieldError message={errors.employeeId} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Full Name</span>
          <input
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
            className={cn("h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring", errors.name && "border-destructive")}
            placeholder="Employee name"
            disabled={isSubmitting}
          />
          <FieldError message={errors.name} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Phone</span>
          <input
            value={values.phone}
            onChange={(event) => updateValue("phone", event.target.value)}
            className={cn("h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring", errors.phone && "border-destructive")}
            placeholder="+880 1700 000000"
            disabled={isSubmitting}
          />
          <FieldError message={errors.phone} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
            className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Optional"
            disabled={isSubmitting}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Date of Birth</span>
          <input
            type="date"
            value={values.dateOfBirth}
            onChange={(event) => updateValue("dateOfBirth", event.target.value)}
            className={cn("h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring", errors.dateOfBirth && "border-destructive")}
            disabled={isSubmitting}
          />
          <FieldError message={errors.dateOfBirth} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Joining Date</span>
          <input
            type="date"
            value={values.joiningDate}
            onChange={(event) => updateValue("joiningDate", event.target.value)}
            className={cn("h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring", errors.joiningDate && "border-destructive")}
            disabled={isSubmitting}
          />
          <FieldError message={errors.joiningDate} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Role</span>
          <select
            value={values.roleId}
            onChange={(event) => updateValue("roleId", event.target.value)}
            className={cn("h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring", errors.roleId && "border-destructive")}
            disabled={isSubmitting}
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.roleId} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Reports To</span>
          <select
            value={values.managerId}
            onChange={(event) => updateValue("managerId", event.target.value)}
            className={cn("h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring", errors.managerId && "border-destructive")}
            disabled={isSubmitting || !allowedManagerRole}
          >
            <option value="">
              {allowedManagerRole ? `Select ${allowedManagerRole}` : "No reporting manager"}
            </option>
            {managerOptions.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} ({manager.employeeId})
              </option>
            ))}
          </select>
          <FieldError message={errors.managerId} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Status</span>
          <select
            value={values.status}
            onChange={(event) =>
              updateValue(
                "status",
                event.target.value as EmployeeFormValues["status"],
              )
            }
            className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isSubmitting}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      {message ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{message}</p>
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
