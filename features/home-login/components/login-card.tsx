"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { EmployeeIdField } from "@/features/home-login/components/employee-id-field";
import { LoginButton } from "@/features/home-login/components/login-button";
import { PasswordField } from "@/features/home-login/components/password-field";
import { RememberMeCheckbox } from "@/features/home-login/components/remember-me-checkbox";
import type { LoginActionState } from "@/features/auth/actions/login.action";
import { appConfig } from "@/lib/config";

type FormErrors = {
  employeeId?: string;
  password?: string;
};

type LoginCardProps = {
  onLogin: (input: {
    employeeId: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<LoginActionState>;
};

export function LoginCard({ onLogin }: LoginCardProps) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      setMessage("Please complete the required fields.");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    const result = await onLogin({
      employeeId,
      password,
      rememberMe,
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
    <section className="app-card relative z-10 w-full max-w-md overflow-hidden p-6 sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-raised)]">
              <Building2 className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Company Hub</p>
              <p className="text-sm text-muted-foreground">Workspace sign in</p>
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      <div className="mb-8">
        <p className="app-page-eyebrow">Employee Login</p>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to continue with announcements, resources, attendance, and
          daily company work.
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
          <div className="rounded-2xl border border-white/20 bg-background/70 p-3 text-sm text-muted-foreground">
            Signing you in...
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{message || "Unable to sign in."}</p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{message || "Login successful."}</p>
          </div>
        ) : null}
      </form>

      <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-white/20 bg-background/60 px-3 py-1.5">
          Secure employee access
        </span>
        <span className="rounded-full border border-white/20 bg-background/60 px-3 py-1.5">
          Role-aware workspace
        </span>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Version {appConfig.version}
      </p>
    </section>
  );
}
