"use client";

import { useEffect, useMemo, useState } from "react";
import { Cake, PartyPopper, Sparkles, X } from "lucide-react";

import {
  PremiumCard,
  PremiumIconContainer,
} from "@/components/common/premium-card";
import { Button } from "@/components/ui/button";
import type {
  CelebrationDashboardData,
  CelebrationItem,
} from "@/features/celebrations/types/celebration.types";

type TodaysCelebrationsCardProps = {
  celebrations: CelebrationDashboardData;
  dateKey: string;
};

function CelebrationList({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Cake;
  title: string;
  items: CelebrationDashboardData["birthdays"];
}) {
  return (
    <div className="rounded-2xl border border-white/30 bg-background/75 p-3">
      <div className="flex items-center gap-2">
        <PremiumIconContainer icon={Icon} className="size-8" iconClassName="size-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
      </div>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={`${item.eventType}-${item.employeeId}`}
              className="rounded-2xl border border-white/20 bg-card/80 px-3 py-2"
            >
              <p className="text-sm font-semibold">{item.employeeName}</p>
              <p className="text-xs text-muted-foreground">
                {item.eventType === "work_anniversary" && item.yearsCompleted
                  ? `${item.yearsCompleted} year${item.yearsCompleted === 1 ? "" : "s"}`
                  : item.employeeCode}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatYearsCompleted(yearsCompleted: number | null) {
  if (!yearsCompleted) {
    return "Work anniversary";
  }

  return `${yearsCompleted} year${yearsCompleted === 1 ? "" : "s"} completed`;
}

function buildCelebrationMessage(
  employeeName: string,
  birthdays: CelebrationItem[],
  workAnniversaries: CelebrationItem[],
) {
  if (birthdays.length > 0 && workAnniversaries.length > 0) {
    const anniversary = workAnniversaries[0];

    return {
      title: "A special day worth celebrating",
      description: `${employeeName}, happy birthday and happy work anniversary. Today marks ${formatYearsCompleted(anniversary?.yearsCompleted ?? null).toLowerCase()} with your company.`,
    };
  }

  if (birthdays.length > 0) {
    return {
      title: "Happy Birthday",
      description: `${employeeName}, wishing you a joyful birthday and a wonderful day ahead.`,
    };
  }

  const anniversary = workAnniversaries[0];

  return {
    title: "Happy Work Anniversary",
    description: `${employeeName}, congratulations on ${formatYearsCompleted(anniversary?.yearsCompleted ?? null).toLowerCase()}. Thank you for your contribution.`,
  };
}

export function TodaysCelebrationsCard({
  celebrations,
  dateKey,
}: TodaysCelebrationsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const items = useMemo(
    () => [...celebrations.birthdays, ...celebrations.workAnniversaries],
    [celebrations.birthdays, celebrations.workAnniversaries],
  );
  const primaryCelebration = items[0] ?? null;
  const hasCelebrations = items.length > 0;
  const modalStorageKey = primaryCelebration
    ? `celebration-modal:${dateKey}:${primaryCelebration.employeeCode}`
    : null;
  const celebrationMessage = primaryCelebration
    ? buildCelebrationMessage(
        primaryCelebration.employeeName,
        celebrations.birthdays,
        celebrations.workAnniversaries,
      )
    : null;

  useEffect(() => {
    if (!modalStorageKey) {
      return;
    }

    try {
      const hasDismissedModal =
        window.localStorage.getItem(modalStorageKey) === "dismissed";

      setIsModalOpen(!hasDismissedModal);
    } catch (error) {
      console.error(
        "[TodaysCelebrationsCard] Unable to read celebration modal state.",
        error,
      );
      setIsModalOpen(true);
    }
  }, [modalStorageKey]);

  function handleDismissModal() {
    if (modalStorageKey) {
      try {
        window.localStorage.setItem(modalStorageKey, "dismissed");
      } catch (error) {
        console.error(
          "[TodaysCelebrationsCard] Unable to persist celebration modal state.",
          error,
        );
      }
    }

    setIsModalOpen(false);
  }

  if (!hasCelebrations || !primaryCelebration || !celebrationMessage) {
    return null;
  }

  return (
    <>
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center">
          <PremiumCard
            tone="purple"
            className="relative w-full max-w-lg overflow-hidden p-5 sm:p-6"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 size-9 rounded-full"
              onClick={handleDismissModal}
              aria-label="Dismiss celebration message"
            >
              <X />
            </Button>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="celebration-modal-title"
              className="space-y-5"
            >
              <div className="flex items-start gap-3">
                <PremiumIconContainer
                  icon={Sparkles}
                  className="size-12"
                  iconClassName="size-5"
                />
                <div className="space-y-2 pr-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Today&apos;s moment
                  </p>
                  <h2
                    id="celebration-modal-title"
                    className="text-2xl font-semibold tracking-tight text-foreground"
                  >
                    {celebrationMessage.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {celebrationMessage.description}
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/30 bg-background/75 p-4">
                <div className="flex items-center gap-3">
                  <PremiumIconContainer
                    icon={
                      celebrations.birthdays.length > 0 ? Cake : PartyPopper
                    }
                    className="size-10"
                    iconClassName="size-4"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {primaryCelebration.employeeName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {celebrations.birthdays.length > 0 &&
                      celebrations.workAnniversaries.length > 0
                        ? "Birthday and work anniversary"
                        : celebrations.birthdays.length > 0
                          ? "Birthday celebration"
                          : "Work anniversary celebration"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" className="min-w-32" onClick={handleDismissModal}>
                  Continue
                </Button>
              </div>
            </div>
          </PremiumCard>
        </div>
      ) : null}
      <PremiumCard tone="purple" className="p-4">
        <div className="flex items-center gap-3">
          <PremiumIconContainer icon={PartyPopper} className="size-10" />
          <div>
            <h2 className="text-base font-semibold">Today&apos;s Celebrations</h2>
            <p className="text-sm text-muted-foreground">
              A milestone created just for you today.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {celebrations.birthdays.length > 0 ? (
            <CelebrationList
              icon={Cake}
              title="Birthday"
              items={celebrations.birthdays}
            />
          ) : null}
          {celebrations.workAnniversaries.length > 0 ? (
            <CelebrationList
              icon={PartyPopper}
              title="Work Anniversary"
              items={celebrations.workAnniversaries}
            />
          ) : null}
        </div>
      </PremiumCard>
    </>
  );
}
