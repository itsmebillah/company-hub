"use client";

import { Bell, Globe2, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes = [
  { value: "system", label: "Auto", icon: Laptop },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function PreferencesSection() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="app-card p-5">
      <h2 className="font-semibold">Preferences</h2>

      <div className="mt-4 space-y-5">
        <div>
          <span className="text-sm font-medium">Theme</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {themes.map((item) => {
              const Icon = item.icon;
              const isActive = theme === item.value;

              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={isActive ? "secondary" : "outline"}
                  className={cn(
                    "h-11 justify-start",
                    isActive && "border-primary",
                  )}
                  onClick={() => setTheme(item.value)}
                  aria-pressed={isActive}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="bg-background/70 flex items-center gap-3 rounded-2xl border border-white/20 p-3">
            <div className="flex items-center gap-3">
              <Globe2
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">Language</p>
                <p className="text-muted-foreground text-xs">English</p>
              </div>
            </div>
          </div>

          <div className="bg-background/70 flex items-center gap-3 rounded-2xl border border-white/20 p-3">
            <div className="flex items-center gap-3">
              <Bell
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-muted-foreground text-xs">Enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
