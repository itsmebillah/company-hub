"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmployeeWorkModeBadge } from "@/features/employees/ui/employee-work-mode-badge";
import { ProfilePhotoUploader } from "@/features/profile/components/profile-photo-uploader";
import type {
  ProfileActionState,
  ProfileData,
  ProfileFormValues,
} from "@/features/profile/types/profile.types";
import { cn } from "@/lib/utils";

type ProfileDetailsFormProps = {
  profile: ProfileData;
  onSave: (values: ProfileFormValues) => Promise<ProfileActionState>;
};

function initialValues(profile: ProfileData): ProfileFormValues {
  return {
    phone: profile.phone,
    email: profile.email,
    dateOfBirth: profile.dateOfBirth,
    photoUrl: profile.photoUrl,
  };
}

export function ProfileDetailsForm({
  profile,
  onSave,
}: ProfileDetailsFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(
    initialValues(profile),
  );
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof ProfileFormValues>(
    key: Key,
    value: ProfileFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    const result = await onSave(values);

    setIsSubmitting(false);
    setStatus(result.ok ? "success" : "error");
    setMessage(result.message);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <ProfilePhotoUploader
        name={profile.fullName}
        value={values.photoUrl}
        onChange={(value) => updateValue("photoUrl", value)}
      />

      <section className="app-card p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Employee ID</span>
            <input
              value={profile.employeeId}
              readOnly
              className="h-11 w-full rounded-md border bg-muted px-3 text-muted-foreground"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Full Name</span>
            <input
              value={profile.fullName}
              readOnly
              className="h-11 w-full rounded-md border bg-muted px-3 text-muted-foreground"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Phone</span>
            <input
              value={values.phone}
              onChange={(event) => updateValue("phone", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Date of Birth</span>
            <input
              type="date"
              value={values.dateOfBirth}
              onChange={(event) =>
                updateValue("dateOfBirth", event.target.value)
              }
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Joining Date</span>
            <input
              value={profile.joiningDate || "Not set"}
              readOnly
              className="h-11 w-full rounded-md border bg-muted px-3 text-muted-foreground"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Role</span>
            <input
              value={profile.roleName}
              readOnly
              className="h-11 w-full rounded-md border bg-muted px-3 text-muted-foreground"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Reports To</span>
            <input
              value={profile.reportsTo}
              readOnly
              className="h-11 w-full rounded-md border bg-muted px-3 text-muted-foreground"
            />
          </label>
          <div className="space-y-2">
            <span className="text-sm font-medium">Work Mode</span>
            <div className="flex h-11 items-center rounded-md border bg-muted px-3">
              <EmployeeWorkModeBadge workMode={profile.workMode} />
            </div>
          </div>
          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <input
              value={profile.status}
              readOnly
              className="h-11 w-full rounded-md border bg-muted px-3 capitalize text-muted-foreground"
            />
          </label>
        </div>

        {message ? (
          <div
            className={cn(
              "mt-4 flex items-start gap-2 rounded-2xl border p-3 text-sm",
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

        <div className="mt-5 flex justify-end border-t pt-4">
          <Button type="submit" className="h-11" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            Save Profile
          </Button>
        </div>
      </section>
    </form>
  );
}
