"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmployeeIdInput } from "@/features/auth/components/employee-id-input";
import { LoginButton } from "@/features/auth/components/login-button";
import { PasswordInput } from "@/features/auth/components/password-input";
import { RememberMe } from "@/features/auth/components/remember-me";
import type { LoginActionState } from "@/features/auth/actions/login.action";

type LoginErrors = {
  employeeId?: string;
  password?: string;
};

type LoginFormProps = {
  onLogin: (input: {
    employeeId: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<LoginActionState>;
};

export function LoginForm({ onLogin }: LoginFormProps) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const nextErrors: LoginErrors = {};

    if (!employeeId.trim()) {
      nextErrors.employeeId = "Employee ID is required.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
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
    <div className="w-full rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your employee credentials.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <EmployeeIdInput
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          error={errors.employeeId}
          placeholder="EMP001"
          disabled={isLoading}
        />

        <PasswordInput
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          placeholder="Enter password"
          disabled={isLoading}
          isVisible={showPassword}
          onVisibilityChange={setShowPassword}
        />

        <RememberMe
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          disabled={isLoading}
        />

        <LoginButton isLoading={isLoading}>Login</LoginButton>

        {status === "error" ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{message || "Unable to sign in."}</p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{message || "Login successful."}</p>
          </div>
        ) : null}
      </form>
    </div>
  );
}
