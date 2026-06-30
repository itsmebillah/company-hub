"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Building2 } from "lucide-react";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { EmployeeIdField } from "@/features/home-login/components/employee-id-field";
import { LoginButton } from "@/features/home-login/components/login-button";
import { PasswordField } from "@/features/home-login/components/password-field";
import { RememberMeCheckbox } from "@/features/home-login/components/remember-me-checkbox";
import { appConfig } from "@/lib/config";

type FormErrors = {
  employeeId?: string;
  password?: string;
};

export function LoginCard() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const nextErrors: FormErrors = {};

    if (!employeeId.trim()) {
      nextErrors.employeeId = "Employee ID required.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      return;
    }

    setIsLoading(true);
    setStatus("idle");

    window.setTimeout(() => {
      setIsLoading(false);
      setStatus("success");
    }, 600);
  }

  return (
    <section className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Building2 className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Company Hub</p>
              <p className="text-sm text-muted-foreground">Welcome back</p>
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to Company Hub
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <EmployeeIdField
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          error={errors.employeeId}
          placeholder="EMP001"
          disabled={isLoading}
        />

        <PasswordField
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          placeholder="Enter password"
          disabled={isLoading}
          isVisible={showPassword}
          onVisibilityChange={setShowPassword}
        />

        <RememberMeCheckbox
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          disabled={isLoading}
        />

        <LoginButton isLoading={isLoading}>Login</LoginButton>

        {isLoading ? (
          <div className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
            Loading placeholder
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>Error placeholder</p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>Success placeholder</p>
          </div>
        ) : null}
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Version {appConfig.version}
      </p>
    </section>
  );
}
