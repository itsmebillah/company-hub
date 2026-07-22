import {
  archiveAnnouncementAction,
  createAnnouncementAction,
  restoreAnnouncementAction,
  updateAnnouncementAction,
} from "@/features/announcements/actions/announcement.actions";
import { AnnouncementManagementPage } from "@/features/announcements/components";
import { AnnouncementService } from "@/features/announcements/services/announcement.service";
import type {
  AnnouncementPriority,
  AnnouncementStatus,
} from "@/features/announcements/types/announcement.types";
import { requireCurrentCompanyId } from "@/features/auth/services/current-company-context.service";

export const dynamic = "force-dynamic";

type AdminAnnouncementsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
    target?: string;
  }>;
};

function parseStatus(value: string | undefined): AnnouncementStatus | "all" {
  if (value === "active" || value === "inactive" || value === "archived") {
    return value;
  }

  return "all";
}

function parsePriority(value: string | undefined): AnnouncementPriority | "all" {
  if (
    value === "low" ||
    value === "normal" ||
    value === "high" ||
    value === "urgent"
  ) {
    return value;
  }

  return "all";
}

export default async function AdminAnnouncementsPage({
  searchParams,
}: AdminAnnouncementsPageProps) {
  const params = await searchParams;
  const companyId = await requireCurrentCompanyId();
  const target =
    params.target === "company" ||
    params.target === "roles" ||
    params.target === "employees"
      ? params.target
      : "all";
  const [result, audienceOptions] = await Promise.all([
    AnnouncementService.list({
      search: params.search,
      status: parseStatus(params.status),
      priority: parsePriority(params.priority),
      target,
    }),
    AnnouncementService.getAudienceOptions(),
  ]);

  return (
    <AnnouncementManagementPage
      result={result}
      companyId={companyId}
      audienceOptions={audienceOptions}
      filters={{
        search: params.search ?? "",
        status: params.status ?? "",
        priority: params.priority ?? "",
        target: params.target ?? "",
      }}
      onCreate={createAnnouncementAction}
      onUpdate={updateAnnouncementAction}
      onArchive={archiveAnnouncementAction}
      onRestore={restoreAnnouncementAction}
    />
  );
}
