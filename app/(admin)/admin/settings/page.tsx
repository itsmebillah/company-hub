import { DashboardService } from "@/features/admin-dashboard/services/dashboard.service";
import { AttendanceSettingsService } from "@/features/attendance/services/attendance-settings.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { AdminSettingsCenter } from "@/features/company-settings/components";
import { getCompanySettings } from "@/features/company-settings/services/company-settings.service";
import { appConfig } from "@/lib/config/app";
import { getSupabaseAdminEnv } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";
import { requireCurrentCompanyId } from "@/features/auth/services/current-company-context.service";

export const dynamic = "force-dynamic";

type StorageDatabase = {
  storage: {
    Tables: {
      buckets: {
        Row: {
          id: string;
          public: boolean;
        };
      };
      objects: {
        Row: {
          metadata: {
            size?: number;
          } | null;
        };
      };
    };
  };
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

const COMPANY_MEDIA_BUCKETS = [
  "announcement-images",
  "company-assets",
  "resource-icons",
  "category-icons",
] as const;

async function getStorageOverview(companyId: string) {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  const supabase = createClient<StorageDatabase>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const [bucketsResult, objectsResult] = await Promise.all([
    supabase
      .schema("storage")
      .from("buckets")
      .select("id, public")
      .in("id", [...COMPANY_MEDIA_BUCKETS])
      .order("id", { ascending: true }),
    supabase
      .schema("storage")
      .from("objects")
      .select("metadata")
      .in("bucket_id", [...COMPANY_MEDIA_BUCKETS])
      .like("name", `${companyId}/%`),
  ]);

  if (bucketsResult.error || objectsResult.error) {
    return {
      totalBuckets: 0,
      publicBuckets: 0,
      privateBuckets: 0,
      totalObjects: 0,
      totalSizeLabel: "Unavailable",
      buckets: [],
    };
  }

  const buckets: Array<{ id: string; public: boolean }> = bucketsResult.data ?? [];
  const objects: Array<{ metadata?: { size?: number } | null }> =
    objectsResult.data ?? [];

  const totalSizeBytes = objects.reduce((sum, object) => {
    const size =
      typeof object.metadata === "object" &&
      object.metadata &&
      "size" in object.metadata &&
      typeof object.metadata.size === "number"
        ? object.metadata.size
        : 0;

    return sum + size;
  }, 0);

  return {
    totalBuckets: buckets.length,
    publicBuckets: buckets.filter((bucket) => bucket.public).length,
    privateBuckets: buckets.filter((bucket) => !bucket.public).length,
    totalObjects: objects.length,
    totalSizeLabel: formatBytes(totalSizeBytes),
    buckets: buckets.map((bucket) => ({
      id: bucket.id,
      isPublic: bucket.public,
    })),
  };
}

export default async function AdminSettingsPage() {
  const companyId = await requireCurrentCompanyId();
  const [
    companySettings,
    attendanceSettings,
    storageOverview,
    dashboard,
    profile,
  ] =
    await Promise.all([
      getCompanySettings(),
      AttendanceSettingsService.getSettings(),
      getStorageOverview(companyId),
      DashboardService.getAdminDashboardData(),
      getCurrentSessionProfile(),
    ]);

  return (
    <AdminSettingsCenter
      companyId={profile?.companyId ?? ""}
      companySettings={companySettings}
      attendanceSettings={attendanceSettings}
      storageOverview={storageOverview}
      systemOverview={{
        version: appConfig.version,
        environment: appConfig.environment ?? "unknown",
        databaseStatus: "Connected",
        storageStatus:
          storageOverview.totalBuckets > 0 ? "Configured" : "Not configured",
        buildTarget: "Next.js App Router",
        totalModules: dashboard.totalModules,
      }}
      metrics={{
        employees: dashboard.counts.employees,
        activeAnnouncements: dashboard.counts.activeAnnouncements,
        activeResources: dashboard.counts.activeResources,
        unreadNotifications: dashboard.counts.unreadNotifications,
      }}
    />
  );
}
