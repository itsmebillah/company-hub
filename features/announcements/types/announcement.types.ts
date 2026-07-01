import type { Database } from "@/lib/supabase/types";

export type AnnouncementStatus = Database["public"]["Enums"]["record_status"];
export type AnnouncementPriority =
  Database["public"]["Enums"]["announcement_priority"];

export type AnnouncementListItem = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  priority: AnnouncementPriority;
  publishFrom: string;
  publishUntil: string;
  status: AnnouncementStatus;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementFormValues = {
  title: string;
  description: string;
  content: string;
  bannerUrl: string;
  priority: AnnouncementPriority;
  publishFrom: string;
  publishUntil: string;
  status: AnnouncementStatus;
  targetAudience: "company" | "roles" | "employees";
};

export type AnnouncementFilters = {
  search?: string;
  status?: AnnouncementStatus | "all";
  priority?: AnnouncementPriority | "all";
  target?: "all" | "company" | "roles" | "employees";
};

export type AnnouncementListResult = {
  announcements: AnnouncementListItem[];
};

export type AnnouncementActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
