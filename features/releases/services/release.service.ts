import "server-only";

import { unstable_cache } from "next/cache";

import { PlatformAuditService } from "@/features/platform-control/services/platform-audit.service";
import { requireSystemAdmin } from "@/features/platform-control/services/system-admin.service";
import type {
  ReleaseRecord,
  ReleaseStatus,
  ReleaseType,
} from "@/features/releases/types/release.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

function toStringArray(value: Json): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toRelease(row: {
  id: string;
  version: string;
  title: string;
  description: string;
  release_type: string;
  whats_new: Json;
  bug_fixes: Json;
  improvements: Json;
  breaking_changes: Json;
  requires_update: boolean;
  show_popup: boolean;
  published_at: string | null;
  commit_sha: string;
  deployment_id: string;
  status: string;
  release_notes: string;
}): ReleaseRecord {
  return {
    id: row.id,
    version: row.version,
    title: row.title,
    description: row.description,
    releaseType: row.release_type as ReleaseType,
    whatsNew: toStringArray(row.whats_new),
    bugFixes: toStringArray(row.bug_fixes),
    improvements: toStringArray(row.improvements),
    breakingChanges: toStringArray(row.breaking_changes),
    requiresUpdate: row.requires_update,
    showPopup: row.show_popup,
    publishedAt: row.published_at,
    commitSha: row.commit_sha,
    deploymentId: row.deployment_id,
    status: row.status as ReleaseStatus,
    releaseNotes: row.release_notes,
  };
}

const getLatestPublishedCached = unstable_cache(
  async () => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("platform_releases")
      .select("*")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error("Unable to load the latest release.");
    return data ? toRelease(data) : null;
  },
  ["latest-platform-release"],
  { revalidate: 60 },
);

export const ReleaseService = {
  getLatestPublished: getLatestPublishedCached,

  async listPublished() {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("platform_releases")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw new Error("Unable to load release history.");
    return data.map(toRelease);
  },

  async listAll() {
    await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("platform_releases")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Unable to load release management.");
    return data.map(toRelease);
  },

  async updateControls(input: {
    releaseId: string;
    status: ReleaseStatus;
    requiresUpdate: boolean;
    showPopup: boolean;
  }) {
    const actor = await requireSystemAdmin();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("platform_releases")
      .update({
        status: input.status,
        requires_update: input.requiresUpdate,
        show_popup: input.showPopup,
        published_at:
          input.status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.releaseId);
    if (error) throw new Error("Unable to update release controls.");
    await PlatformAuditService.log({
      category: "audit",
      action: "release_controls_updated",
      entityType: "platform_release",
      entityId: input.releaseId,
      description: "System Admin updated release visibility controls.",
      platformAdminId: actor.id,
      metadata: {
        status: input.status,
        requiresUpdate: input.requiresUpdate,
        showPopup: input.showPopup,
      },
    });
  },

  async recordReceipt(releaseId: string, event: "dismissed" | "installed") {
    const authClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) return;
    const supabase = createSupabaseAdminClient();
    const timestamp = new Date().toISOString();
    await supabase.from("release_receipts").upsert(
      {
        release_id: releaseId,
        auth_user_id: user.id,
        ...(event === "dismissed"
          ? { dismissed_at: timestamp }
          : { installed_at: timestamp }),
        updated_at: timestamp,
      },
      { onConflict: "release_id,auth_user_id" },
    );
  },
};
