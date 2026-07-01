"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Image,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmployeeIdInput } from "@/features/auth/components/employee-id-input";
import { PasswordInput } from "@/features/auth/components/password-input";
import type { BootstrapActionState } from "@/features/auth/actions/bootstrap.action";
import { cn } from "@/lib/utils";

type BootstrapSetupFormProps = {
  onBootstrap: (input: {
    companyName: string;
    companyLogo: string;
    supportEmail: string;
    supportPhone: string;
    employeeId: string;
    name: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => Promise<BootstrapActionState>;
};

type FormErrors = {
  companyName?: string;
  employeeId?: string;
  name?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  icon: LucideIcon;
  error?: string;
  disabled?: boolean;
  type?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
};

function TextField({
  id,
  label,
  value,
  placeholder,
  icon: Icon,
  error,
  disabled,
  type = "text",
  autoComplete,
  onChange,
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 items-center rounded-lg border bg-background px-3 shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
          error ? "border-destructive" : "border-input",
        )}
      >
        <Icon className="mr-3 size-4 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
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

export function BootstrapSetupForm({ onBootstrap }: BootstrapSetupFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState("Company Hub");
  const [companyLogo, setCompanyLogo] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  function validateCompanyStep() {
    const nextErrors: FormErrors = {};

    if (!companyName.trim()) {
      nextErrors.companyName = "Company name is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setMessage("Please complete the required company information.");
      return false;
    }

    setStatus("idle");
    setMessage("");
    return true;
  }

  function handleNextStep() {
    if (validateCompanyStep()) {
      setStep(2);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const nextErrors: FormErrors = {};

    if (!companyName.trim()) {
      nextErrors.companyName = "Company name is required.";
    }

    if (!employeeId.trim()) {
      nextErrors.employeeId = "Employee ID is required.";
    }

    if (!name.trim()) {
      nextErrors.name = "Full name is required.";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Phone is required.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Confirm password is required.";
    }

    if (password && password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
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
      companyName,
      companyLogo,
      supportEmail,
      supportPhone,
      employeeId,
      name,
      phone,
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
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1 text-sm font-medium">
          <div
            className={cn(
              "rounded-md px-3 py-2 text-center",
              step === 1 && "bg-background shadow-sm",
            )}
          >
            Company
          </div>
          <div
            className={cn(
              "rounded-md px-3 py-2 text-center",
              step === 2 && "bg-background shadow-sm",
            )}
          >
            Administrator
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-5">
            <TextField
              id="company-name"
              label="Company Name"
              value={companyName}
              onChange={setCompanyName}
              error={errors.companyName}
              placeholder="Company Hub"
              icon={Building2}
              disabled={isLoading}
              autoComplete="organization"
            />
            <TextField
              id="company-logo"
              label="Company Logo"
              value={companyLogo}
              onChange={setCompanyLogo}
              placeholder="Optional logo URL"
              icon={Image}
              disabled={isLoading}
            />
            <TextField
              id="support-email"
              label="Support Email"
              value={supportEmail}
              onChange={setSupportEmail}
              placeholder="Optional support email"
              icon={Mail}
              type="email"
              disabled={isLoading}
              autoComplete="email"
            />
            <TextField
              id="support-phone"
              label="Support Phone"
              value={supportPhone}
              onChange={setSupportPhone}
              placeholder="Optional support phone"
              icon={Phone}
              disabled={isLoading}
              autoComplete="tel"
            />

            <Button
              type="button"
              className="h-12 w-full rounded-lg text-base"
              onClick={handleNextStep}
              disabled={isLoading}
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <EmployeeIdInput
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              error={errors.employeeId}
              placeholder="ADMIN001"
              disabled={isLoading}
            />

            <TextField
              id="admin-name"
              label="Full Name"
              value={name}
              onChange={setName}
              error={errors.name}
              placeholder="Admin name"
              icon={User}
              disabled={isLoading}
              autoComplete="name"
            />

            <TextField
              id="admin-phone"
              label="Phone"
              value={phone}
              onChange={setPhone}
              error={errors.phone}
              placeholder="+880 1700 000000"
              icon={Phone}
              disabled={isLoading}
              autoComplete="tel"
            />

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

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-lg text-base"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="h-12 rounded-lg text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="size-4" aria-hidden="true" />
                )}
                Create Admin
              </Button>
            </div>
          </div>
        )}

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
