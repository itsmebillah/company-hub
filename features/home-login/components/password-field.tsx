"use client";

import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  isVisible: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
};

export function PasswordField({
  error,
  className,
  id = "home-password",
  isVisible,
  onVisibilityChange,
  ...props
}: PasswordFieldProps) {
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        Password
      </label>
      <div
        className={cn(
          "flex h-12 items-center rounded-xl border bg-background px-3 shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
          error ? "border-destructive" : "border-input",
        )}
      >
        <Lock className="mr-3 size-4 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground",
            className,
          )}
          {...props}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="ml-2 size-9 rounded-lg"
          onClick={() => onVisibilityChange(!isVisible)}
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
