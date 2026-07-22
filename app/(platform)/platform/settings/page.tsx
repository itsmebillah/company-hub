import { updatePlatformSettingsAction } from "@/features/platform-control/actions/platform-control.actions";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";
import { requireSystemAdminPage } from "@/features/platform-control/services/system-admin.service";

export default async function PlatformSettingsPage() {
  await requireSystemAdminPage();
  const settings = await PlatformControlService.getSettings();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-primary text-sm font-semibold">Global control</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Platform settings</h1>
        <p className="text-muted-foreground mt-2">
          Platform-only branding and operational defaults. Company Admins cannot
          read or change these values.
        </p>
      </div>
      <form
        action={updatePlatformSettingsAction}
        className="app-card grid gap-5 p-4 sm:grid-cols-2 sm:p-6"
      >
        <label className="text-sm font-medium">
          Platform name
          <input
            name="platformName"
            defaultValue={settings.platformName}
            minLength={2}
            required
            className="bg-background mt-2 h-11 w-full rounded-xl border px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Primary color
          <input
            name="primaryColor"
            type="color"
            defaultValue={settings.primaryColor}
            required
            className="bg-background mt-2 h-11 w-full rounded-xl border p-1"
          />
        </label>
        <label className="text-sm font-medium">
          Logo URL or Storage path
          <input
            name="logoUrl"
            defaultValue={settings.logoUrl}
            className="bg-background mt-2 h-11 w-full rounded-xl border px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Favicon URL or Storage path
          <input
            name="faviconUrl"
            defaultValue={settings.faviconUrl}
            className="bg-background mt-2 h-11 w-full rounded-xl border px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Support email
          <input
            name="supportEmail"
            type="email"
            defaultValue={settings.supportEmail}
            className="bg-background mt-2 h-11 w-full rounded-xl border px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Default timezone
          <input
            name="defaultTimezone"
            defaultValue={settings.defaultTimezone}
            required
            className="bg-background mt-2 h-11 w-full rounded-xl border px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Audit retention target (days)
          <input
            name="auditRetentionDays"
            type="number"
            min={30}
            max={3650}
            defaultValue={settings.auditRetentionDays}
            required
            className="bg-background mt-2 h-11 w-full rounded-xl border px-3"
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border px-3 text-sm font-medium">
          <input
            name="allowCompanyCreation"
            type="checkbox"
            defaultChecked={settings.allowCompanyCreation}
            className="size-5"
          />
          Allow new company creation
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Maintenance message
          <textarea
            name="maintenanceMessage"
            defaultValue={settings.maintenanceMessage}
            rows={3}
            maxLength={500}
            className="bg-background mt-2 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <div className="sm:col-span-2">
          <button className="bg-primary text-primary-foreground min-h-11 w-full rounded-xl px-5 font-semibold sm:w-auto">
            Save platform settings
          </button>
        </div>
      </form>
    </div>
  );
}
