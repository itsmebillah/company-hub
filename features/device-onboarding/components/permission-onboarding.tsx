"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PermissionOnboardingProps = {
  companyId: string;
  version: number;
  requireCamera: boolean;
};

type PermissionState = "idle" | "checking" | "granted" | "denied" | "skipped";
type StepId = "welcome" | "location" | "notifications" | "camera" | "finished";

const STORAGE_PREFIX = "company-hub:permission-onboarding";

function getStorageKey(companyId: string, version: number) {
  return `${STORAGE_PREFIX}:${companyId}:v${version}`;
}

function getPermissionLabel(state: PermissionState) {
  if (state === "granted") {
    return "Enabled";
  }

  if (state === "denied") {
    return "Not enabled";
  }

  if (state === "skipped") {
    return "Skipped";
  }

  return "";
}

function getPermissionClassName(state: PermissionState) {
  if (state === "granted") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (state === "denied") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }

  if (state === "skipped") {
    return "border-slate-500/20 bg-slate-500/10 text-muted-foreground";
  }

  return "border-border bg-muted/40 text-muted-foreground";
}

function isBrowserPermissionDenied(error: unknown) {
  const geolocationError = error as {
    code?: number;
    PERMISSION_DENIED?: number;
  } | null;

  return (
    Boolean(geolocationError) &&
    geolocationError?.code === geolocationError?.PERMISSION_DENIED
  );
}

async function requestLocationPermission() {
  if (!("geolocation" in navigator)) {
    return "denied" as const;
  }

  return new Promise<"granted" | "denied">((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve("granted"),
      (error) => resolve(isBrowserPermissionDenied(error) ? "denied" : "denied"),
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  });
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return "denied" as const;
  }

  if (Notification.permission === "granted") {
    return "granted" as const;
  }

  if (Notification.permission === "denied") {
    return "denied" as const;
  }

  const permission = await Notification.requestPermission();

  return permission === "granted" ? "granted" : "denied";
}

async function requestCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return "denied" as const;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    return "granted" as const;
  } catch {
    return "denied" as const;
  }
}

export function PermissionOnboarding({
  companyId,
  version,
  requireCamera,
}: PermissionOnboardingProps) {
  const steps = useMemo<StepId[]>(
    () =>
      requireCamera
        ? ["welcome", "location", "notifications", "camera", "finished"]
        : ["welcome", "location", "notifications", "finished"],
    [requireCamera],
  );
  const storageKey = getStorageKey(companyId, version);
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [locationState, setLocationState] = useState<PermissionState>("idle");
  const [notificationState, setNotificationState] =
    useState<PermissionState>("idle");
  const [cameraState, setCameraState] = useState<PermissionState>(
    requireCamera ? "idle" : "skipped",
  );
  const currentStep = steps[stepIndex];

  useEffect(() => {
    try {
      setIsOpen(window.localStorage.getItem(storageKey) !== "complete");
    } catch {
      setIsOpen(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!requireCamera) {
      setCameraState("skipped");
    }
  }, [requireCamera]);

  function goNext() {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function completeOnboarding() {
    try {
      window.localStorage.setItem(storageKey, "complete");
    } catch {
      // Local storage may be unavailable in private browsing. The flow should
      // still close for the current session.
    }

    setIsOpen(false);
  }

  async function handleLocationRequest() {
    if (locationState === "checking") {
      return;
    }

    setLocationState("checking");
    setLocationState(await requestLocationPermission());
  }

  async function handleNotificationRequest() {
    if (notificationState === "checking") {
      return;
    }

    setNotificationState("checking");
    setNotificationState(await requestNotificationPermission());
  }

  async function handleCameraRequest() {
    if (cameraState === "checking") {
      return;
    }

    setCameraState("checking");
    setCameraState(await requestCameraPermission());
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-background/70 p-3 backdrop-blur-md sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-onboarding-title"
    >
      <section className="w-full overflow-hidden rounded-[1.6rem] border bg-card shadow-[var(--shadow-card)] sm:max-w-md">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <div className="mt-2 flex gap-1">
              {steps.map((step, index) => (
                <span
                  key={step}
                  className={cn(
                    "h-1.5 w-8 rounded-full",
                    index <= stepIndex ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close permission onboarding"
            onClick={completeOnboarding}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-6">
          {currentStep === "welcome" ? (
            <OnboardingPanel
              icon={ShieldCheck}
              title="Welcome to Company Hub"
              description="Company Hub needs a few permissions to provide attendance, alerts, and mobile app features. You stay in control and can skip anything."
            />
          ) : null}

          {currentStep === "location" ? (
            <PermissionPanel
              icon={MapPin}
              title="Location"
              description="Location is used for attendance verification, GPS validation, and field employee tracking."
              state={locationState}
              deniedHelp="If location is blocked, enable it later from browser site settings before GPS attendance."
              onRequest={handleLocationRequest}
            />
          ) : null}

          {currentStep === "notifications" ? (
            <PermissionPanel
              icon={Bell}
              title="Notifications"
              description="Notifications help you receive announcements, leave approvals, attendance alerts, resources, and system updates instantly."
              state={notificationState}
              deniedHelp="If notifications are blocked, enable them later from browser site settings."
              onRequest={handleNotificationRequest}
            />
          ) : null}

          {currentStep === "camera" ? (
            <PermissionPanel
              icon={Camera}
              title="Camera"
              description="Camera is only needed because attendance selfie verification is currently enabled."
              state={cameraState}
              deniedHelp="If camera is blocked, enable it later before selfie attendance."
              onRequest={handleCameraRequest}
            />
          ) : null}

          {currentStep === "finished" ? (
            <OnboardingPanel
              icon={CheckCircle2}
              title="You're all set!"
              description="Enjoy using Company Hub. You can update browser permissions later from your device or browser settings."
            />
          ) : null}
        </div>

        <div className="flex gap-2 border-t px-5 py-4">
          {currentStep === "finished" ? (
            <Button className="h-11 flex-1" onClick={completeOnboarding}>
              Start Using Company Hub
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={goNext}
              >
                Skip
              </Button>
              <Button type="button" className="h-11 flex-1" onClick={goNext}>
                Continue
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function OnboardingPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 id="permission-onboarding-title" className="mt-5 text-xl font-semibold">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function PermissionPanel({
  icon: Icon,
  title,
  description,
  state,
  deniedHelp,
  onRequest,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  state: PermissionState;
  deniedHelp: string;
  onRequest: () => Promise<void>;
}) {
  const isChecking = state === "checking";
  const label = getPermissionLabel(state);

  return (
    <div>
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <h2 id="permission-onboarding-title" className="mt-5 text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {label ? (
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-medium",
              getPermissionClassName(state),
            )}
          >
            {label}
            {state === "denied" ? (
              <p className="mt-1 text-xs font-normal">{deniedHelp}</p>
            ) : null}
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          disabled={isChecking || state === "granted"}
          onClick={() => {
            void onRequest();
          }}
        >
          {isChecking ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Icon className="size-4" aria-hidden="true" />
          )}
          {state === "granted" ? "Permission Enabled" : `Enable ${title}`}
        </Button>
      </div>
    </div>
  );
}
