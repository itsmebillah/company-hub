import type { User } from "@supabase/supabase-js";

import type { AttendanceCheckInput } from "@/features/attendance/types/attendance.types";
import type { FeatureKey } from "@/features/platform-control/types/platform.types";

export type MobileSessionProfile = {
  employeeId: string;
  name: string;
  companyId: string;
  roleName: string;
};

export type MobileDashboardProfile = MobileSessionProfile & {
  companyName: string;
  photoUrl: string | null;
};

export type MobileDashboardFeature = {
  key: FeatureKey;
  enabled: boolean;
};

export type MobileDashboardSectionStatus = "ready" | "disabled" | "error";

export type MobileQuickLink = {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  url: string | null;
  icon: string | null;
  thumbnailUrl: string | null;
  openMode: "same_tab" | "new_tab" | "external";
  isFeatured: boolean;
};

export type MobileNotification = {
  id: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
};

export type MobileAnnouncement = {
  id: string;
  title: string;
  description: string;
  priority: string;
  bannerUrl: string | null;
  publishFrom: string | null;
};

export type MobileCelebration = {
  type: "birthday" | "work_anniversary";
  title: string;
  yearsCompleted: number | null;
};

export type MobileToday = {
  date: string;
  status: "working_day" | "holiday" | "optional_holiday";
  title: string;
  celebrations: MobileCelebration[];
};

export type MobileDashboardSection<T> = {
  status: MobileDashboardSectionStatus;
  data: T;
};

export type MobileDashboardContent = {
  quickLinks: MobileDashboardSection<MobileQuickLink[]>;
  notifications: MobileDashboardSection<{
    unreadCount: number;
    items: MobileNotification[];
  }>;
  announcements: MobileDashboardSection<MobileAnnouncement[]>;
  today: MobileDashboardSection<MobileToday | null>;
};

export type MobileDashboard = {
  profile: MobileDashboardProfile;
  features: MobileDashboardFeature[];
  enabledFeatureKeys: FeatureKey[];
  content: MobileDashboardContent;
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
