import type { FeatureDefinition } from "@/features/platform-control/types/platform.types";
import type { EmployeePortalCategory } from "@/features/employee-resources/types/employee-resource.types";
import type { NotificationSummary } from "@/features/notifications/types/notification.types";
import type { AnnouncementListItem } from "@/features/announcements/types/announcement.types";
import type { CelebrationDashboardData } from "@/features/celebrations/types/celebration.types";
import type { CalendarDayInfo } from "@/features/company-calendar/types/calendar.types";
import {
  getAnnouncementImageSrc,
  getProfilePhotoSrc,
  getPublicStorageUrl,
  RESOURCE_ICONS_BUCKET,
} from "@/lib/media";
import type {
  MobileAuthContext,
  MobileDashboard,
  MobileDashboardContent,
  MobileDashboardFeature,
  MobileDashboardProfile,
  MobileDashboardSection,
} from "@/features/mobile-api/types/mobile-api.types";

export type MobileDashboardEmployeeRow = {
  id: string;
  employee_id: string;
  name: string;
  company_id: string;
  status: string;
  photo_url: string | null;
};

export type MobileDashboardCompanySettingsRow = {
  company_name: string | null;
};

export function toMobileDashboardFeatures(
  features: FeatureDefinition[],
): MobileDashboardFeature[] {
  return features.map((feature) => ({
    key: feature.key,
    enabled: feature.effectiveState === "enabled",
  }));
}

export function toMobileDashboardProfile(input: {
  context: MobileAuthContext;
  employee: MobileDashboardEmployeeRow;
  settings: MobileDashboardCompanySettingsRow | null;
}): MobileDashboardProfile {
  return {
    employeeId: input.context.employee.employeeId,
    name: input.context.employee.name,
    companyId: input.context.employee.companyId,
    roleName: input.context.employee.roleName,
    companyName: input.settings?.company_name?.trim() || "Company Hub",
    photoUrl: getProfilePhotoSrc(input.employee.photo_url),
  };
}

export function mobileDashboardSection<T>(input: {
  enabled: boolean;
  data: T;
  failed?: boolean;
}): MobileDashboardSection<T> {
  return {
    status: input.enabled ? (input.failed ? "error" : "ready") : "disabled",
    data: input.data,
  };
}

export function toMobileQuickLinks(categories: EmployeePortalCategory[]) {
  return categories
    .flatMap((category) =>
      category.resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        categoryName: category.name,
        url: /^https?:\/\//i.test(resource.url) ? resource.url : null,
        icon: resource.icon.trim() || null,
        thumbnailUrl: getPublicStorageUrl(
          RESOURCE_ICONS_BUCKET,
          resource.thumbnail,
        ),
        openMode: resource.openMode,
        isFeatured: resource.isFeatured,
      })),
    )
    .sort(
      (first, second) => Number(second.isFeatured) - Number(first.isFeatured),
    );
}

export function toMobileNotifications(summary: NotificationSummary) {
  return {
    unreadCount: summary.unreadCount,
    items: summary.latest.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    })),
  };
}

export function toMobileAnnouncements(announcements: AnnouncementListItem[]) {
  return announcements.slice(0, 5).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    description: announcement.description,
    priority: announcement.priority,
    bannerUrl: getAnnouncementImageSrc(announcement.bannerUrl),
    publishFrom: announcement.publishFrom || null,
  }));
}
export function toMobileToday(input: {
  day: CalendarDayInfo;
  celebrations: CelebrationDashboardData;
  employeeCode: string;
}) {
  const celebrations = [
    ...input.celebrations.birthdays,
    ...input.celebrations.workAnniversaries,
  ]
    .filter((celebration) => celebration.employeeCode === input.employeeCode)
    .map((celebration) => ({
      type: celebration.eventType,
      title:
        celebration.eventType === "birthday"
          ? "Happy birthday!"
          : "Work anniversary",
      yearsCompleted: celebration.yearsCompleted,
    }));

  return {
    date: input.day.date,
    status: input.day.status,
    title: input.day.title,
    celebrations,
  };
}

export function emptyMobileDashboardContent(): MobileDashboardContent {
  return {
    quickLinks: mobileDashboardSection({ enabled: false, data: [] }),
    notifications: mobileDashboardSection({
      enabled: false,
      data: { unreadCount: 0, items: [] },
    }),
    announcements: mobileDashboardSection({ enabled: false, data: [] }),
    today: mobileDashboardSection({ enabled: false, data: null }),
  };
}

export function toMobileDashboard(input: {
  context: MobileAuthContext;
  employee: MobileDashboardEmployeeRow;
  settings: MobileDashboardCompanySettingsRow | null;
  features: FeatureDefinition[];
  content?: MobileDashboardContent;
}): MobileDashboard {
  const features = toMobileDashboardFeatures(input.features);

  return {
    profile: toMobileDashboardProfile(input),
    features,
    enabledFeatureKeys: features
      .filter((feature) => feature.enabled)
      .map((feature) => feature.key),
    content: input.content ?? emptyMobileDashboardContent(),
  };
}
