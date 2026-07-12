import type { Database } from "@/lib/supabase/types";

export type ProfileStatus = Database["public"]["Enums"]["record_status"];
export type ProfileWorkMode =
  Database["public"]["Enums"]["employee_work_mode"];

export type ProfileData = {
  id: string;
  employeeId: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  joiningDate: string;
  photoUrl: string;
  roleName: string;
  reportsTo: string;
  workMode: ProfileWorkMode;
  status: ProfileStatus;
};

export type ProfileFormValues = {
  phone: string;
  email: string;
  dateOfBirth: string;
  photoUrl: string;
};

export type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ProfileActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
