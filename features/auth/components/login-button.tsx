import type { ButtonHTMLAttributes } from "react";
import { Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";

type LoginButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
};

export function LoginButton({
  children = "Login",
  disabled,
  isLoading = false,
  ...props
}: LoginButtonProps) {
  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-lg text-base"
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogIn className="size-4" aria-hidden="true" />
      )}
      {children}
    </Button>
  );
}
