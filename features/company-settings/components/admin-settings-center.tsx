import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  Database,
  HardDrive,
  Layers3,
  Megaphone,
  Palette,
  ShieldCheck,
  Users,
} from "lucide-react";

import { IconBadge } from "@/components/common/icon-badge";
import { PageHeader } from "@/components/common/page-header";
import { CompanySettingsForm } from "@/features/company-settings/components/company-settings-form";
import { updateCompanySettingsAction } from "@/features/company-settings/actions/company-settings.actions";
import type { AttendanceSettingsValues } from "@/features/attendance/types/attendance.types";
import type { CompanySettingsValues } from "@/features/company-settings/types/company-settings.types";
import { PwaInstallSettingsCard } from "@/features/pwa/components/pwa-install-settings-card";
import { formatTimeValueLabel } from "@/features/attendance/utils/working-hours";
import { cn } from "@/lib/utils";
import type { FeatureKey } from "@/features/platform-control/types/platform.types";

type SettingsNavItem = {
  label: string;
  href: string;
  icon: typeof Building2;
  featureKey?: FeatureKey;
};

type SettingsMetric = {
  label: string;
  value: string;
  description: string;
};

type StorageOverview = {
  totalBuckets: number;
  publicBuckets: number;
  privateBuckets: number;
  totalObjects: number;
  totalSizeLabel: string;
  buckets: Array<{
    id: string;
    isPublic: boolean;
  }>;
};

type SystemOverview = {
  version: string;
  environment: string;
  databaseStatus: string;
  storageStatus: string;
  buildTarget: string;
  totalModules: number;
};

type AdminSettingsCenterProps = {
  companyId: string;
  companySettings: CompanySettingsValues;
  attendanceSettings: AttendanceSettingsValues;
  storageOverview: StorageOverview;
  systemOverview: SystemOverview;
  metrics: {
    employees: number;
    activeAnnouncements: number;
    activeResources: number;
    unreadNotifications: number;
  };
  enabledFeatures: FeatureKey[];
};

const navItems: SettingsNavItem[] = [
  { label: "General", href: "#general-settings", icon: Building2 },
  {
    label: "Company Profile",
    href: "#company-profile",
    icon: BriefcaseBusiness,
  },
  { label: "Branding", href: "#branding", icon: Palette },
  {
    label: "Attendance",
    href: "#attendance",
    icon: CalendarCheck,
    featureKey: "attendance",
  },
  {
    label: "Announcements",
    href: "#announcements",
    icon: Megaphone,
    featureKey: "announcements",
  },
  {
    label: "Employees",
    href: "#employees",
    icon: Users,
    featureKey: "employee_directory",
  },
  { label: "Security", href: "#security", icon: ShieldCheck },
  { label: "Application", href: "#application", icon: Layers3 },
  { label: "Storage", href: "#storage", icon: HardDrive },
  { label: "System", href: "#system", icon: Database },
];

function MetricCard({ label, value, description }: SettingsMetric) {
  return (
    <div className="app-card app-card-subtle p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {description}
      </p>
    </div>
  );
}

export function AdminSettingsCenter({
  companyId,
  companySettings,
  attendanceSettings,
  storageOverview,
  systemOverview,
  metrics,
  enabledFeatures,
}: AdminSettingsCenterProps) {
  const enabledFeatureSet = new Set(enabledFeatures);
  const visibleNavItems = navItems.filter(
    (item) => !item.featureKey || enabledFeatureSet.has(item.featureKey),
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin Settings Center"
        title="Company-wide controls without leaving the admin workspace"
        description="Update branding, notifications, resource defaults, attendance rules, storage visibility, and system context from one mobile-friendly hub."
        aside={<IconBadge icon={Database} className="mx-auto lg:mx-0" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Employees"
          value={String(metrics.employees)}
          description="Current employee records managed by this company."
        />
        {enabledFeatures.some((key) =>
          (
            ["resources", "quick_links", "knowledge_hub"] as FeatureKey[]
          ).includes(key),
        ) ? (
          <MetricCard
            label="Resources"
            value={String(metrics.activeResources)}
            description="Active quick links and resource entries available today."
          />
        ) : null}
        {enabledFeatureSet.has("announcements") ? (
          <MetricCard
            label="Announcements"
            value={String(metrics.activeAnnouncements)}
            description="Currently active communication items across the portal."
          />
        ) : null}
        {enabledFeatureSet.has("notifications") ? (
          <MetricCard
            label="Unread Notifications"
            value={String(metrics.unreadNotifications)}
            description="Company notifications still waiting to be opened."
          />
        ) : null}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Settings Navigation</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Jump directly to each settings area. Long forms stay on the same
            page so mobile and desktop admins keep context while editing.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visibleNavItems.map(({ href, icon: Icon, label }) => (
            <a
              key={href}
              href={href}
              className="app-card app-card-subtle hover:border-primary/25 flex min-h-14 items-center gap-3 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5"
            >
              <span className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-2xl">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="break-words">{label}</span>
            </a>
          ))}
        </div>
      </section>

      <CompanySettingsForm
        initialValues={companySettings}
        onSave={updateCompanySettingsAction}
      />

      <PwaInstallSettingsCard
        companyId={companyId}
        onboardingVersion={
          companySettings.securityPreferences.permissionOnboardingVersion
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {enabledFeatureSet.has("attendance") ? (
          <section id="attendance" className="app-card scroll-mt-24 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Attendance</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Attendance settings continue to use the existing attendance
                  policy engine and assigned-location architecture.
                </p>
              </div>
              <Link
                href="/admin/settings/attendance"
                className="bg-background/75 hover:bg-muted inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/20 px-3 text-sm font-medium transition"
              >
                Manage Attendance
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="Attendance Mode"
                value={attendanceSettings.attendanceMode.replaceAll("_", " ")}
                description="Shared policy mode currently applied to check-in and check-out."
              />
              <MetricCard
                label="Office Hours"
                value={`${formatTimeValueLabel(attendanceSettings.officeStartTime)} - ${formatTimeValueLabel(attendanceSettings.officeEndTime)}`}
                description="Office attendance follows the configured start, end, and grace policy."
              />
              <MetricCard
                label="Grace Period"
                value={`${attendanceSettings.officeGracePeriodMinutes} min`}
                description="Late status begins after the configured grace window ends."
              />
              <MetricCard
                label="GPS Radius"
                value={`${attendanceSettings.allowedRadiusMeters} m`}
                description="Allowed distance from an approved attendance location."
              />
              <MetricCard
                label="GPS Accuracy"
                value={`${attendanceSettings.gpsAccuracyThresholdMeters} m`}
                description="Minimum GPS precision required before attendance can continue."
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Require GPS",
                  enabled: attendanceSettings.requireGps,
                },
                {
                  label: "Require High Accuracy",
                  enabled: attendanceSettings.requireHighAccuracy,
                },
                {
                  label: "Enable Geofence",
                  enabled: attendanceSettings.enableGeofence,
                },
                {
                  label: "Require Selfie",
                  enabled: attendanceSettings.requireSelfie,
                },
                {
                  label: "Weekend Working",
                  enabled: attendanceSettings.weekendWorkingEnabled,
                },
                {
                  label: "Allow Late Check-out",
                  enabled: attendanceSettings.allowLateCheckOut,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-background/75 rounded-2xl border border-white/20 px-4 py-3"
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      item.enabled
                        ? "text-emerald-600"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="space-y-6">
          {enabledFeatureSet.has("announcements") ? (
            <section id="announcements" className="app-card scroll-mt-24 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Announcements</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Keep announcement publishing in its existing module while
                    exposing status and navigation from settings.
                  </p>
                </div>
                <Megaphone className="text-primary size-5" aria-hidden="true" />
              </div>
              <div className="bg-background/75 mt-4 rounded-2xl border border-white/20 p-4">
                <p className="text-muted-foreground text-sm">
                  Active announcements
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {metrics.activeAnnouncements}
                </p>
                <Link
                  href="/admin/announcements"
                  className="text-primary mt-4 inline-flex items-center gap-2 text-sm font-medium"
                >
                  Open announcements
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          ) : null}

          {enabledFeatureSet.has("employee_directory") ? (
            <section id="employees" className="app-card scroll-mt-24 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Employees</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Employee CRUD stays in the employee module. Settings acts as
                    the operational jump point for admin configuration.
                  </p>
                </div>
                <Users className="text-primary size-5" aria-hidden="true" />
              </div>
              <div className="bg-background/75 mt-4 rounded-2xl border border-white/20 p-4">
                <p className="text-muted-foreground text-sm">
                  Managed employees
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {metrics.employees}
                </p>
                <Link
                  href="/admin/users"
                  className="text-primary mt-4 inline-flex items-center gap-2 text-sm font-medium"
                >
                  Open employee management
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section
          id="storage"
          className="app-card scroll-mt-24 p-5 xl:col-span-1"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Storage</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Visibility over storage buckets, stored media volume, and future
                cleanup operations.
              </p>
            </div>
            <HardDrive className="text-primary size-5" aria-hidden="true" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard
              label="Total Buckets"
              value={String(storageOverview.totalBuckets)}
              description={`${storageOverview.publicBuckets} company-media buckets are configured; object totals are restricted to this company.`}
            />
            <MetricCard
              label="Stored Objects"
              value={String(storageOverview.totalObjects)}
              description={`Approximate storage usage: ${storageOverview.totalSizeLabel}.`}
            />
          </div>

          <div className="bg-background/75 mt-4 rounded-2xl border border-white/20 p-4">
            <p className="text-sm font-medium">Bucket Overview</p>
            <div className="mt-3 space-y-2">
              {storageOverview.buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 px-3 py-2 text-sm"
                >
                  <span className="break-words">{bucket.id}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      bucket.isPublic
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300",
                    )}
                  >
                    {bucket.isPublic ? "Public" : "Private"}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-muted-foreground mt-4 rounded-2xl border border-dashed p-3 text-sm">
              Media cleanup tools are intentionally prepared as a future safe
              admin workflow.
            </div>
          </div>
        </section>

        <section
          id="system"
          className="app-card scroll-mt-24 p-5 xl:col-span-1"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">System</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Read-only runtime context for the current Company Hub
                deployment.
              </p>
            </div>
            <Database className="text-primary size-5" aria-hidden="true" />
          </div>

          <div className="mt-5 grid gap-3">
            {[
              ["Version", systemOverview.version],
              ["Environment", systemOverview.environment],
              ["Database", systemOverview.databaseStatus],
              ["Storage", systemOverview.storageStatus],
              ["Build", systemOverview.buildTarget],
              ["Modules", String(systemOverview.totalModules)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-background/75 flex items-center justify-between gap-3 rounded-2xl border border-white/20 px-4 py-3"
              >
                <span className="text-muted-foreground text-sm">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
