"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmployeeIdInput } from "@/features/auth/components/employee-id-input";
import { PasswordInput } from "@/features/auth/components/password-input";
import type { BootstrapActionState } from "@/features/auth/actions/bootstrap.action";
import { cn } from "@/lib/utils";

type BootstrapSetupFormProps = {
  onBootstrap: (input: {
    employeeId: string;
    name: string;
    password: string;
    confirmPassword: string;
  }) => Promise<BootstrapActionState>;
};

type FormErrors = {
  employeeId?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
};

export function BootstrapSetupForm({ onBootstrap }: BootstrapSetupFormProps) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const nextErrors: FormErrors = {};

    if (!employeeId.trim()) {
      nextErrors.employeeId = "Employee ID is required.";
    }

    if (!name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Confirm password is required.";
    }

    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setMessage("Please complete the required fields.");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    const result = await onBootstrap({
      employeeId,
      name,
      password,
      confirmPassword,
    });

    if (!result.ok) {
      setIsLoading(false);
      setStatus("error");
      setMessage(result.message);
      return;
    }

    setStatus("success");
    setMessage(result.message);
    router.replace(result.redirectTo);
  }

  return (
    <div className="w-full rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bootstrap Setup
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create the first administrator account.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <EmployeeIdInput
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          error={errors.employeeId}
          placeholder="EMP001"
          disabled={isLoading}
        />

        <div className="space-y-2">
          <label htmlFor="admin-name" className="text-sm font-medium">
            Name
          </label>
          <div
            className={cn(
              "flex h-12 items-center rounded-lg border bg-background px-3 shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
              errors.name ? "border-destructive" : "border-input",
            )}
          >
            <User className="mr-3 size-4 text-muted-foreground" aria-hidden="true" />
            <input
              id="admin-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLoading}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "admin-name-error" : undefined}
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              placeholder="Admin name"
            />
          </div>
          {errors.name ? (
            <p id="admin-name-error" className="text-sm text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <PasswordInput
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          placeholder="Create password"
          disabled={isLoading}
          isVisible={showPassword}
          onVisibilityChange={setShowPassword}
          autoComplete="new-password"
        />

        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
          placeholder="Confirm password"
          disabled={isLoading}
          isVisible={showConfirmPassword}
          onVisibilityChange={setShowConfirmPassword}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          className="h-12 w-full rounded-lg text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-4" aria-hidden="true" />
          )}
          Create Admin
        </Button>

        {status === "error" ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{message}</p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{message}</p>
          </div>
        ) : null}
      </form>
    </div>
  );
}
