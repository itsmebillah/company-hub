import { redirect } from "next/navigation";

import { EmployeeAttendanceCard } from "@/features/attendance/components";
import {
  checkInAction,
  checkOutAction,
  prepareCheckInAction,
} from "@/features/attendance/actions/attendance.actions";
import { uploadAttendanceSelfieAction } from "@/features/attendance/actions/attendance-selfie.actions";
import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { AttendanceService } from "@/features/attendance/services/attendance.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const sessionProfile = await getCurrentSessionProfile();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.admin
  ) {
    redirect(getAdminEquivalentPath("/attendance"));
  }

  const attendance = await AttendanceService.getTodayAttendance();

  return (
    <EmployeeAttendanceCard
      attendance={attendance}
      onCheckIn={checkInAction}
      onCheckOut={checkOutAction}
      onValidateLocation={prepareCheckInAction}
      onUploadSelfie={uploadAttendanceSelfieAction}
    />
  );
}
