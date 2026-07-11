import { Building2, PanelsTopLeft } from "lucide-react";

export function BrandPanel() {
  return (
    <section className="relative hidden min-h-svh flex-col justify-between overflow-hidden border-r border-white/20 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(243,246,255,0.96))] p-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.92),rgba(7,10,20,0.98))] lg:flex lg:basis-[45%]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(148,163,184,0.05)_45%,transparent_100%)]" />
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-raised)]">
          <Building2 className="size-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xl font-semibold">Company Hub</p>
          <p className="text-sm text-muted-foreground">
            One workspace for company operations
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-lg space-y-6">
        <div className="app-card overflow-hidden p-6">
          <div className="rounded-[1.75rem] border border-white/30 bg-background/75 p-8 shadow-[var(--shadow-soft)]">
            <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <PanelsTopLeft className="size-10" aria-hidden="true" />
            </div>
            <div className="mt-6 grid gap-3">
              {[
                "Unified navigation across every module",
                "Fast access to attendance, announcements, and resources",
                "Responsive design tuned for desktop and mobile",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/20 bg-background/70 px-4 py-3 text-sm text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <p className="app-page-eyebrow">Premium Internal Workspace</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Welcome to Company Hub
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            A focused, secure business application for company tools,
            communication, and daily workflows.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Premium, mobile-first, and built for operational clarity.
      </p>
    </section>
  );
}
