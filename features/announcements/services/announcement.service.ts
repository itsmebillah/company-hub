import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPriorityRank } from "@/features/announcements/constants/announcement-options";
import { AnnouncementValidationService } from "@/features/announcements/services/announcement-validation.service";
import type {
  AnnouncementFilters,
  AnnouncementFormValues,
  AnnouncementListItem,
  AnnouncementListResult,
  AnnouncementStatus,
} from "@/features/announcements/types/announcement.types";

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

async function getCompanyId() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("Company was not found.");
  }

  return data.id;
}

function toListItem(row: {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  priority: AnnouncementListItem["priority"];
  publish_from: string | null;
  publish_until: string | null;
  status: AnnouncementStatus;
  created_at: string;
  updated_at: string;
}): AnnouncementListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    bannerUrl: row.banner_url ?? "",
    priority: row.priority,
    publishFrom: row.publish_from ?? "",
    publishUntil: row.publish_until ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortAnnouncements(
  announcements: AnnouncementListItem[],
): AnnouncementListItem[] {
  return [...announcements].sort((first, second) => {
    const firstPriority = getPriorityRank(first.priority);
    const secondPriority = getPriorityRank(second.priority);

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    return (
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
  });
}

export const AnnouncementService = {
  async list(filters: AnnouncementFilters): Promise<AnnouncementListResult> {
    const supabase = createSupabaseAdminClient();
    const companyId = await getCompanyId();
    const search = filters.search?.trim();

    let query = supabase
      .from("announcements")
      .select(
        "id, title, description, banner_url, priority, publish_from, publish_until, status, created_at, updated_at",
      )
      .eq("company_id", companyId);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      throw new Error("Unable to load announcements.");
    }

    return {
      announcements: sortAnnouncements(data.map(toListItem)),
    };
  },

  async listForEmployee(): Promise<AnnouncementListResult> {
    const supabase = createSupabaseAdminClient();
    const companyId = await getCompanyId();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "id, title, description, banner_url, priority, publish_from, publish_until, status, created_at, updated_at",
      )
      .eq("company_id", companyId)
      .eq("status", "active")
      .or(`publish_from.is.null,publish_from.lte.${now}`)
      .or(`publish_until.is.null,publish_until.gte.${now}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Unable to load announcements.");
    }

    return {
      announcements: sortAnnouncements(data.map(toListItem)),
    };
  },

  async create(values: AnnouncementFormValues) {
    const validated = AnnouncementValidationService.validate(values);
    const supabase = createSupabaseAdminClient();
    const companyId = await getCompanyId();
    const { error } = await supabase.from("announcements").insert({
      company_id: companyId,
      title: validated.title,
      description: normalizeOptional(validated.description),
      banner_url: normalizeOptional(validated.bannerUrl),
      priority: validated.priority,
      publish_from: validated.publishFrom,
      publish_until: validated.publishUntil,
      status: validated.status,
    });

    if (error) {
      throw new Error("Unable to create announcement.");
    }
  },

  async update(id: string, values: AnnouncementFormValues) {
    const validated = AnnouncementValidationService.validate(values);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("announcements")
      .update({
        title: validated.title,
        description: normalizeOptional(validated.description),
        banner_url: normalizeOptional(validated.bannerUrl),
        priority: validated.priority,
        publish_from: validated.publishFrom,
        publish_until: validated.publishUntil,
        status: validated.status,
      })
      .eq("id", id);

    if (error) {
      throw new Error("Unable to update announcement.");
    }
  },

  async setStatus(id: string, status: Extract<AnnouncementStatus, "active" | "archived">) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("announcements")
      .update({ status })
      .eq("id", id);

    if (error) {
      throw new Error("Unable to update announcement status.");
    }
  },
};
