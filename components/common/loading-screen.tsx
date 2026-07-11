import { Loader2 } from "lucide-react";

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = "Loading" }: LoadingScreenProps) {
  return (
    <main className="app-shell flex min-h-svh items-center justify-center px-6 py-12">
      <section className="app-card app-card-subtle w-full max-w-sm px-6 py-8 text-center">
        <div className="app-icon-wrap mx-auto size-14 rounded-2xl text-primary shadow-[var(--shadow-soft)]">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight">{label}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Preparing your workspace with the latest company context.
        </p>
      </section>
    </main>
  );
}
