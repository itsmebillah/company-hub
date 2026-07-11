"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  PasswordFormValues,
  ProfileActionState,
} from "@/features/profile/types/profile.types";
import { cn } from "@/lib/utils";

type PasswordSectionProps = {
  onSave: (values: PasswordFormValues) => Promise<ProfileActionState>;
};

const emptyValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordSection({ onSave }: PasswordSectionProps) {
  const [values, setValues] = useState<PasswordFormValues>(emptyValues);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof PasswordFormValues>(
    key: Key,
    value: PasswordFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validateClient() {
    if (!values.currentPassword) {
      return "Current password is required.";
    }

    if (values.newPassword.length < 8) {
      return "New password must be at least 8 characters.";
    }

    if (values.newPassword !== values.confirmPassword) {
      return "New passwords do not match.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationMessage = validateClient();

    if (validationMessage) {
      setStatus("error");
      setMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    const result = await onSave(values);

    setIsSubmitting(false);
    setStatus(result.ok ? "success" : "error");
    setMessage(result.message);

    if (result.ok) {
      setValues(emptyValues);
    }
  }

  const inputType = showPassword ? "text" : "password";

  return (
    <section className="app-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Password</h2>
          <p className="text-sm text-muted-foreground">Update account access.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide passwords" : "Show passwords"}
        >
          {showPassword ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="space-y-2">
          <span className="text-sm font-medium">Current Password</span>
          <input
            type={inputType}
            value={values.currentPassword}
            onChange={(event) =>
              updateValue("currentPassword", event.target.value)
            }
            className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoComplete="current-password"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">New Password</span>
          <input
            type={inputType}
            value={values.newPassword}
            onChange={(event) => updateValue("newPassword", event.target.value)}
            className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoComplete="new-password"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Confirm Password</span>
          <input
            type={inputType}
            value={values.confirmPassword}
            onChange={(event) =>
              updateValue("confirmPassword", event.target.value)
            }
            className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoComplete="new-password"
          />
        </label>

        {message ? (
          <div
            className={cn(
              "flex items-start gap-2 rounded-2xl border p-3 text-sm",
              status === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {status === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <p>{message}</p>
          </div>
        ) : null}

        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Lock className="size-4" aria-hidden="true" />
          )}
          Change Password
        </Button>
      </form>
    </section>
  );
}
