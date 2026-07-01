import type { Database } from "@/lib/supabase/types";

export type ResourceStatus = Database["public"]["Enums"]["record_status"];
export type ResourceType = Database["public"]["Enums"]["resource_type"];
export type ResourceOpenMode =
  Database["public"]["Enums"]["resource_open_mode"];

export type ResourceCategoryOption = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export type ResourceListItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  resourceType: ResourceType;
  url: string;
  icon: string;
  thumbnail: string;
  displayOrder: number;
  openMode: ResourceOpenMode;
  isFeatured: boolean;
  status: ResourceStatus;
  updatedAt: string;
};

export type ResourceFormValues = {
  categoryId: string;
  title: string;
  description: string;
  resourceType: ResourceType | "";
  url: string;
  icon: string;
  thumbnail: string;
  displayOrder: string;
  openMode: ResourceOpenMode;
  isFeatured: boolean;
  status: ResourceStatus;
};

export type ResourceFilters = {
  search?: string;
  categoryId?: string;
  resourceType?: ResourceType | "all";
  status?: ResourceStatus | "all";
  featured?: "all" | "true" | "false";
  sort?: ResourceSort;
};

export type ResourceSort =
  | "display_order"
  | "title"
  | "created_at"
  | "status";

export type ResourceListResult = {
  resources: ResourceListItem[];
};

export type ResourceActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
