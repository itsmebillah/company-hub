import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type RememberMeProps = InputHTMLAttributes<HTMLInputElement>;

export function RememberMe({ className, id = "remember-me", ...props }: RememberMeProps) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted-foreground"
    >
      <input
        id={id}
        type="checkbox"
        className={cn(
          "size-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        {...props}
      />
      <span>Remember me</span>
    </label>
  );
}
