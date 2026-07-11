"use client";

import { useEffect, useState } from "react";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const themes = [
  { value: "system", label: "Auto", icon: Laptop },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const activeTheme = isMounted ? theme ?? "system" : "system";
  const activeItem =
    themes.find((item) => item.value === activeTheme) ?? themes[0];
  const ActiveIcon = activeItem.icon;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      }}
    >
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-10 border-white/30 bg-background/70 shadow-none backdrop-blur-md"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Theme: ${activeItem.label}`}
        title={`Theme: ${activeItem.label}`}
      >
        <ActiveIcon className="size-4" aria-hidden="true" />
      </Button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 min-w-40 rounded-2xl border bg-popover/95 p-1.5 text-popover-foreground shadow-[var(--shadow-card)] backdrop-blur-xl"
        >
          {themes.map((item) => {
            const Icon = item.icon;
            const isActive = activeTheme === item.value;

            return (
              <button
                key={item.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className="flex h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                onClick={() => {
                  setTheme(item.value);
                  setIsOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </span>
                {isActive ? <Check className="size-4" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
