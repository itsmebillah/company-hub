import type { User } from "@supabase/supabase-js";

import type { AttendanceCheckInput } from "@/features/attendance/types/attendance.types";

export type MobileSessionProfile = {
  employeeId: string;
  name: string;
  companyId: string;
  roleName: string;
};

export type MobileSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn: number;
  tokenType: "bearer";
  profile: MobileSessionProfile;
};

export type MobileAuthContext = {
  user: User;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    companyId: string;
    roleId: string;
    roleName: string;
    managerId: string | null;
    status: "active";
  };
};

export type MobileAttendanceInput = AttendanceCheckInput;

export type MobileTrackingState = {
  status: "inactive" | "active" | "completed" | "stopped" | "revoked";
  sessionId: string | null;
  startedAt: string | null;
  endedAt: string | null;
};
