import { updateReleaseControlsAction } from "@/features/releases/actions/release.actions";
import { ReleaseService } from "@/features/releases/services/release.service";

export default async function PlatformReleasesPage() {
  const releases = await ReleaseService.listAll();
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Release management</h1>
        <p className="text-muted-foreground mt-2">
          Review automatically generated releases and control update visibility.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {releases.map((release) => (
          <article key={release.id} className="app-card p-4 sm:p-5">
            <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
              {release.version} · {release.releaseType}
            </p>
            <h2 className="mt-2 font-semibold">{release.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Commit {release.commitSha.slice(0, 8)} · Deployment{" "}
              {release.deploymentId}
            </p>
            <form
              action={updateReleaseControlsAction}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="releaseId" value={release.id} />
              <select
                name="status"
                defaultValue={release.status}
                className="h-11"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="failed">Failed</option>
              </select>
              <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium">
                <input
                  type="checkbox"
                  name="showPopup"
                  defaultChecked={release.showPopup}
                  className="size-4 w-auto"
                />
                Show update popup
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium">
                <input
                  type="checkbox"
                  name="requiresUpdate"
                  defaultChecked={release.requiresUpdate}
                  className="size-4 w-auto"
                />
                Require update
              </label>
              <button className="bg-primary text-primary-foreground min-h-11 w-full rounded-xl px-4 text-sm font-semibold">
                Save release controls
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
