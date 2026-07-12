import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { updateAttendanceSettingsAction } from "@/features/attendance/actions/attendance-settings.actions";
import { AttendanceSettingsForm } from "@/features/attendance/components";
import { AttendanceSettingsService } from "@/features/attendance/services/attendance-settings.service";

export const dynamic = "force-dynamic";

export default async function AdminAttendanceSettingsPage() {
  const settings = await AttendanceSettingsService.getSettings();

  return (
    <section className="space-y-5">
      <div className="space-y-3">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to settings
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Attendance Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure office working hours, grace periods, early check-in, and the
            shared GPS attendance policy from one place.
          </p>
        </div>
      </div>

      <AttendanceSettingsForm
        initialValues={settings}
        onSave={updateAttendanceSettingsAction}
      />
    </section>
  );
}
