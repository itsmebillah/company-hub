import { ReleaseService } from "@/features/releases/services/release.service";

export const dynamic = "force-dynamic";

export default async function ReleaseHistoryPage() {
  const releases = await ReleaseService.listPublished().catch(() => []);
  return (
    <main className="mx-auto min-h-svh max-w-4xl px-4 py-8 sm:px-6">
      <header className="app-page-header">
        <div>
          <p className="app-page-eyebrow">Company Hub</p>
          <h1 className="app-page-title">Release History</h1>
          <p className="app-page-description mt-2">
            Product updates, fixes, improvements, and deployment history.
          </p>
        </div>
      </header>
      <section className="mt-6 space-y-4">
        {releases.length ? (
          releases.map((release) => (
            <article key={release.id} className="app-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-primary text-xs font-bold tracking-[0.18em] uppercase">
                    Version {release.version} · {release.releaseType}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {release.title}
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {release.description}
                  </p>
                </div>
                <time className="text-muted-foreground text-xs">
                  {release.publishedAt
                    ? new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                      }).format(new Date(release.publishedAt))
                    : "Unpublished"}
                </time>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  ["New", release.whatsNew],
                  ["Fixed", release.bugFixes],
                  ["Improved", release.improvements],
                ].map(([label, items]) => (
                  <div key={label as string}>
                    <h3 className="text-sm font-semibold">{label as string}</h3>
                    <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                      {(items as string[]).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="app-card text-muted-foreground p-6 text-sm">
            No published releases are available yet.
          </div>
        )}
      </section>
    </main>
  );
}
