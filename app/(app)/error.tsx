"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppRouteError({
  error,
  reset,
}: AppRouteErrorProps) {
  console.error("[AppRouteError] Employee workspace failed to render.", {
    message: error.message,
    digest: error.digest,
    stack: error.stack,
  });

  return (
    <main className="flex min-h-[70svh] items-center justify-center px-6 py-12">
      <section className="app-card w-full max-w-md p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle
            className="size-5"
            aria-hidden="true"
          />
        </div>
        <p className="app-page-eyebrow mt-4 justify-center">
          Workspace Error
        </p>
        <h1 className="mt-3 text-xl font-semibold">Workspace unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your employee dashboard could not load completely. The server logs
          include the technical failure details.
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      </section>
    </main>
  );
}
