import { Building2, PanelsTopLeft } from "lucide-react";

export function BrandPanel() {
  return (
    <section className="hidden min-h-svh flex-col justify-between border-r bg-muted/40 p-10 lg:flex lg:basis-[45%]">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <Building2 className="size-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xl font-semibold">Company Hub</p>
          <p className="text-sm text-muted-foreground">Work starts here</p>
        </div>
      </div>

      <div className="max-w-md space-y-5">
        <div className="flex h-72 items-center justify-center rounded-3xl border bg-background shadow-soft">
          <div className="text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <PanelsTopLeft className="size-10" aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Illustration placeholder
            </p>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Welcome to Company Hub
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            A simple, secure place for teams to access company tools,
            announcements, and daily work essentials.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Designed for focused operations and fast access.
      </p>
    </section>
  );
}
