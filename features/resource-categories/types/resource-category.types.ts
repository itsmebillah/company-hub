import type { Database } from "@/lib/supabase/types";

export type ResourceCategoryStatus =
  Database["public"]["Enums"]["record_status"];

export type ResourceCategoryListItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
  displayOrder: number;
  status: ResourceCategoryStatus;
};

export type ResourceCategoryFormValues = {
  name: string;
  icon: string;
  color: string;
  displayOrder: string;
  status: ResourceCategoryStatus;
};

export type ResourceCategoryActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
