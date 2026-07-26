import Link from "next/link";

import { getCurrentSessionProfile } from "@/features/auth/services/session.service";

export default async function NotFoundPage() {
  const profile = await getCurrentSessionProfile();
  if (profile) {
  }

  return (
    <main className="app-shell flex min-h-svh items-center justify-center p-4">
      <section className="app-card w-full max-w-lg p-6 text-center sm:p-8">
        <p className="text-primary text-sm font-semibold">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page unavailable</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          This page does not exist or is not available for your company.
        </p>
        <Link
          href={profile?.isSystemAdmin ? "/platform/dashboard" : "/dashboard"}
          className="bg-primary text-primary-foreground mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl px-5 font-semibold"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
