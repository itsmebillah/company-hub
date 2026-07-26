import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <section className="app-card max-w-lg p-6 text-center sm:p-8">
        <span className="bg-primary/12 text-primary mx-auto flex size-16 items-center justify-center rounded-3xl">
          <Wrench className="size-8" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Scheduled maintenance</h1>
        <p className="text-muted-foreground mt-3 leading-6">
          Company Hub is temporarily unavailable while essential platform work
          is completed. Please try again shortly.
        </p>
      </section>
    </main>
  );
}
