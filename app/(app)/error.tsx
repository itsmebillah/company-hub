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
      <section className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
          <AlertTriangle
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Workspace unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
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
