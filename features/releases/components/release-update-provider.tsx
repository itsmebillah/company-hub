"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, RotateCw, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { recordReleaseReceiptAction } from "@/features/releases/actions/release.actions";
import type { ReleaseRecord } from "@/features/releases/types/release.types";

function toVersionParts(version: string) {
  return version
    .split("-")[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

function isNewerVersion(latest: string, current: string) {
  const latestParts = toVersionParts(latest);
  const currentParts = toVersionParts(current);
  return latestParts.some((part, index) => {
    if (part === currentParts[index]) return false;
    return part > (currentParts[index] ?? 0);
  });
}

export function ReleaseUpdateProvider({
  children,
  currentVersion,
  latestRelease,
}: {
  children: ReactNode;
  currentVersion: string;
  latestRelease: ReleaseRecord | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!latestRelease?.showPopup || pathname === "/releases") {
      setIsOpen(false);
      return;
    }
    const dismissed = window.localStorage.getItem(
      `company-hub-release-dismissed:${latestRelease.version}`,
    );
    if (
      isNewerVersion(latestRelease.version, currentVersion) &&
      (latestRelease.requiresUpdate || !dismissed)
    ) {
      setIsOpen(true);
    }
  }, [currentVersion, latestRelease, pathname]);

  const dismiss = () => {
    if (!latestRelease || latestRelease.requiresUpdate) return;
    window.localStorage.setItem(
      `company-hub-release-dismissed:${latestRelease.version}`,
      "true",
    );
    setIsOpen(false);
    void recordReleaseReceiptAction(latestRelease.id, "dismissed");
  };

  const updateNow = async () => {
    if (!latestRelease) return;
    setIsUpdating(true);
    void recordReleaseReceiptAction(latestRelease.id, "installed");
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.update()),
      );
      registrations.forEach((registration) =>
        registration.waiting?.postMessage({ type: "SKIP_WAITING" }),
      );
    }
    window.location.reload();
  };

  return (
    <>
      {children}
      {isOpen && latestRelease ? (
        <div className="bg-foreground/30 fixed inset-0 z-[100] flex items-end justify-center p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="release-update-title"
            aria-describedby="release-update-description"
            className="bg-background/98 max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-raised)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-2xl shadow-[var(--shadow-raised)]">
                <Rocket className="size-7" aria-hidden="true" />
              </span>
              {!latestRelease.requiresUpdate ? (
                <button
                  type="button"
                  onClick={dismiss}
                  className="focus-visible:ring-ring flex size-11 items-center justify-center rounded-2xl border focus-visible:ring-2 focus-visible:outline-none"
                  aria-label="Close update dialog"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <p className="text-primary mt-5 text-xs font-bold tracking-[0.2em] uppercase">
              Version {latestRelease.version}
            </p>
            <h2
              id="release-update-title"
              className="mt-2 text-2xl font-semibold"
            >
              Company Hub Updated
            </h2>
            <p
              id="release-update-description"
              className="text-muted-foreground mt-2 text-sm leading-6"
            >
              {latestRelease.description || latestRelease.title}
            </p>

            <div className="mt-5 space-y-4">
              {[
                ["New", latestRelease.whatsNew],
                ["Fixed", latestRelease.bugFixes],
                ["Improved", latestRelease.improvements],
              ].map(([label, items]) =>
                (items as string[]).length ? (
                  <div key={label as string}>
                    <h3 className="text-xs font-bold tracking-[0.16em] uppercase">
                      {label as string}
                    </h3>
                    <ul className="text-muted-foreground mt-2 space-y-1.5 text-sm">
                      {(items as string[]).slice(0, 4).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-primary" aria-hidden="true">
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                className="min-h-12"
                onClick={updateNow}
                disabled={isUpdating}
              >
                <RotateCw className="size-4" aria-hidden="true" />
                {isUpdating ? "Updating…" : "Update Now"}
              </Button>
              <Button asChild variant="outline" className="min-h-12">
                <Link href="/releases">View Details</Link>
              </Button>
              {!latestRelease.requiresUpdate ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 sm:col-span-2"
                  onClick={dismiss}
                >
                  Later
                </Button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
