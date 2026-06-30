"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const themes = [
  { value: "system", label: "Auto", icon: Laptop },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex rounded-md border bg-background p-1">
      {themes.map((item) => {
        const Icon = item.icon;
        const isActive = theme === item.value;

        return (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={isActive ? "secondary" : "ghost"}
            className="h-8 px-2"
            onClick={() => setTheme(item.value)}
            aria-pressed={isActive}
            title={item.label}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="sr-only">{item.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
