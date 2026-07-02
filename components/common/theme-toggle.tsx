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
        variant="ghost"
        className="size-9"
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
          className="absolute right-0 top-11 z-50 min-w-36 rounded-md border bg-popover p-1 text-popover-foreground shadow-soft"
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
                className="flex h-9 w-full items-center justify-between gap-3 rounded-sm px-3 text-sm outline-none hover:bg-accent focus-visible:bg-accent"
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
