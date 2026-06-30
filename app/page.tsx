import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg border bg-card">
          <Building2 className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Company Hub
          </h1>
          <p className="text-muted-foreground">
            Project foundation initialized with Next.js, TypeScript, Tailwind
            CSS, shadcn/ui, theming, and PWA metadata.
          </p>
        </div>
        <Button type="button" variant="outline">
          Foundation ready
        </Button>
      </section>
    </main>
  );
}
