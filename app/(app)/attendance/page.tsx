import { EmployeeAttendanceCard } from "@/features/attendance/components";
import {
  checkInAction,
  checkOutAction,
  prepareCheckInAction,
} from "@/features/attendance/actions/attendance.actions";
import { AttendanceService } from "@/features/attendance/services/attendance.service";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const attendance = await AttendanceService.getTodayAttendance();

  return (
    <EmployeeAttendanceCard
      attendance={attendance}
      onCheckIn={checkInAction}
      onCheckOut={checkOutAction}
      onValidateLocation={prepareCheckInAction}
    />
  );
}
