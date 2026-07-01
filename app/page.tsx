import { redirect } from "next/navigation";

import { hasBootstrapAdmin } from "@/features/auth/services/bootstrap.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (await hasBootstrapAdmin()) {
    redirect("/login");
  }

  redirect("/setup");
}
