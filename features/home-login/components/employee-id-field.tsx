import type { InputHTMLAttributes } from "react";
import { Badge } from "lucide-react";

import { cn } from "@/lib/utils";

type EmployeeIdFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function EmployeeIdField({
  error,
  className,
  id = "home-employee-id",
  ...props
}: EmployeeIdFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        Employee ID
      </label>
      <div
        className={cn(
          "flex h-12 items-center rounded-xl border bg-background px-3 shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
          error ? "border-destructive" : "border-input",
        )}
      >
        <Badge className="mr-3 size-4 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          type="text"
          autoComplete="username"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground",
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
