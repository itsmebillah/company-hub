"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  isPermissionOnboardingComplete,
  PERMISSION_ONBOARDING_COMPLETE_EVENT,
} from "@/features/device-onboarding/utils/onboarding-storage";

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  platforms: string[];
  userChoice: Promise<BeforeInstallPromptChoice>;
  prompt: () => Promise<void>;
};

type PwaInstallSnapshot = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isInstallAvailable: boolean;
};

type UsePwaInstallInput = {
  companyId: string;
  onboardingVersion: number;
};

const DISMISS_STORAGE_KEY = "company-hub:pwa-install:dismissed-at";
const INSTALLED_STORAGE_KEY = "company-hub:pwa-install:installed";
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

let hasRegisteredListeners = false;
let snapshot: PwaInstallSnapshot = {
  deferredPrompt: null,
  isInstalled: false,
  isInstallAvailable: false,
};
const subscribers = new Set<(value: PwaInstallSnapshot) => void>();

function emitSnapshot(nextSnapshot: Partial<PwaInstallSnapshot>) {
  snapshot = { ...snapshot, ...nextSnapshot };
  subscribers.forEach((subscriber) => subscriber(snapshot));
}

function getIsStandalone() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      navigatorWithStandalone.standalone === true ||
      window.localStorage.getItem(INSTALLED_STORAGE_KEY) === "true"
    );
  } catch {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      navigatorWithStandalone.standalone === true
    );
  }
}

function getIsIos() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === "macintel" && navigator.maxTouchPoints > 1)
  );
}

function getIsDismissedRecently() {
  try {
    const value = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    const dismissedAt = value ? Number(value) : 0;

    return (
      Number.isFinite(dismissedAt) &&
      dismissedAt > 0 &&
      Date.now() - dismissedAt < DISMISS_WINDOW_MS
    );
  } catch {
    return false;
  }
}

function registerInstallListeners() {
  if (hasRegisteredListeners || typeof window === "undefined") {
    return;
  }

  hasRegisteredListeners = true;
  emitSnapshot({
    isInstalled: getIsStandalone(),
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    emitSnapshot({
      deferredPrompt: event as BeforeInstallPromptEvent,
      isInstallAvailable: true,
      isInstalled: getIsStandalone(),
    });
  });

  window.addEventListener("appinstalled", () => {
    try {
      window.localStorage.setItem(INSTALLED_STORAGE_KEY, "true");
    } catch {
      // Installed state also comes from display-mode checks.
    }

    emitSnapshot({
      deferredPrompt: null,
      isInstallAvailable: false,
      isInstalled: true,
    });
  });

  const standaloneMediaQuery = window.matchMedia("(display-mode: standalone)");

  if ("addEventListener" in standaloneMediaQuery) {
    standaloneMediaQuery.addEventListener("change", (event) => {
      if (event.matches) {
        emitSnapshot({ isInstalled: true });
      }
    });
  }
}

export function usePwaInstall({
  companyId,
  onboardingVersion,
}: UsePwaInstallInput) {
  const [state, setState] = useState(snapshot);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [dismissedRecently, setDismissedRecently] = useState(false);
  const isIos = useMemo(
    () => (typeof window === "undefined" ? false : getIsIos()),
    [],
  );

  useEffect(() => {
    registerInstallListeners();
    setState(snapshot);

    subscribers.add(setState);

    return () => {
      subscribers.delete(setState);
    };
  }, []);

  useEffect(() => {
    function syncReadiness() {
      setIsOnboardingComplete(
        isPermissionOnboardingComplete(companyId, onboardingVersion),
      );
      setDismissedRecently(getIsDismissedRecently());
      emitSnapshot({ isInstalled: getIsStandalone() });
    }

    syncReadiness();
    window.addEventListener(PERMISSION_ONBOARDING_COMPLETE_EVENT, syncReadiness);
    window.addEventListener("storage", syncReadiness);

    return () => {
      window.removeEventListener(
        PERMISSION_ONBOARDING_COMPLETE_EVENT,
        syncReadiness,
      );
      window.removeEventListener("storage", syncReadiness);
    };
  }, [companyId, onboardingVersion]);

  const dismissInstall = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      // If storage is unavailable, dismiss for this component session only.
    }

    setDismissedRecently(true);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!state.deferredPrompt || state.isInstalled) {
      return;
    }

    const promptEvent = state.deferredPrompt;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice.outcome === "accepted") {
      try {
        window.localStorage.setItem(INSTALLED_STORAGE_KEY, "true");
      } catch {
        // Installed state also comes from appinstalled/display-mode checks.
      }

      emitSnapshot({
        deferredPrompt: null,
        isInstallAvailable: false,
        isInstalled: true,
      });
      return;
    }

    dismissInstall();
  }, [dismissInstall, state.deferredPrompt, state.isInstalled]);

  return {
    isInstalled: state.isInstalled,
    isInstallAvailable: state.isInstallAvailable && Boolean(state.deferredPrompt),
    isIosInstallAvailable:
      isIos && !state.isInstalled && !state.isInstallAvailable,
    shouldShowInstallCard:
      isOnboardingComplete &&
      !dismissedRecently &&
      !state.isInstalled &&
      (state.isInstallAvailable || isIos),
    dismissedRecently,
    promptInstall,
    dismissInstall,
  };
}
