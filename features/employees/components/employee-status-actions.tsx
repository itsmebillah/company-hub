"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, PauseCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmployeeActionState, EmployeeStatus } from "@/features/employees/types/employee.types";

type EmployeeStatusActionsProps = {
  employeeId: string;
  status: EmployeeStatus;
  onActivate: (id: string) => Promise<EmployeeActionState>;
  onDeactivate: (id: string) => Promise<EmployeeActionState>;
};

export function EmployeeStatusActions({
  employeeId,
  status,
  onActivate,
  onDeactivate,
}: EmployeeStatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function runAction(action: (id: string) => Promise<EmployeeActionState>) {
    setMessage("");
    startTransition(async () => {
      const result = await action(employeeId);
      setMessage(result.message);
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
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
