import type { Database } from "@/lib/supabase/types";

export type RoleStatus = Database["public"]["Enums"]["record_status"];

export type RoleListItem = {
  id: string;
  name: string;
  displayOrder: number;
  status: RoleStatus;
  isSystemRole: boolean;
  canRename: boolean;
};

export type RoleFormValues = {
  name: string;
  displayOrder: string;
  status: RoleStatus;
};

export type RoleActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
