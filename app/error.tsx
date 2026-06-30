"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: ErrorProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md bg-muted">
          <AlertTriangle className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The application could not complete the request.
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      </section>
    </main>
  );
}
