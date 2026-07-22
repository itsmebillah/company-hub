"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, KeyRound, PauseCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmployeeActionState, EmployeeStatus } from "@/features/employees/types/employee.types";

type EmployeeStatusActionsProps = {
  employeeId: string;
  status: EmployeeStatus;
  onActivate: (id: string) => Promise<EmployeeActionState>;
  onDeactivate: (id: string) => Promise<EmployeeActionState>;
  onResetPassword: (
    id: string,
    confirmation: string,
  ) => Promise<EmployeeActionState>;
};

export function EmployeeStatusActions({
  employeeId,
  status,
  onActivate,
  onDeactivate,
  onResetPassword,
}: EmployeeStatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function runAction(action: (id: string) => Promise<EmployeeActionState>) {
    setMessage("");
    startTransition(async () => {
      const result = await action(employeeId);
      setMessage(result.message);
    });
  }

  function resetPassword() {
    setMessage("");
    startTransition(async () => {
      const result = await onResetPassword(employeeId, confirmation);
      setMessage(result.message);
      if (result.ok) setConfirmation("");
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== "active" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => runAction(onActivate)}
            disabled={isPending}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Activate
          </Button>
        ) : null}
        {status === "active" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => runAction(onDeactivate)}
            disabled={isPending}
          >
            <PauseCircle className="size-4" aria-hidden="true" />
            Deactivate
          </Button>
        ) : null}
      </div>
      <div className="space-y-2 border-t pt-4">
        <label className="block text-sm font-medium" htmlFor="password-reset-confirmation">
          Confirm Employee ID
        </label>
        <input
          id="password-reset-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="h-11 w-full rounded-md border bg-background px-3"
          autoComplete="off"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={resetPassword}
          disabled={isPending || !confirmation.trim()}
          className="w-full"
        >
          <KeyRound className="size-4" aria-hidden="true" />
          Reset initial password
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
