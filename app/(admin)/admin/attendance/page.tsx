import { AdminAttendancePage } from "@/features/attendance/components";
import { AttendanceService } from "@/features/attendance/services/attendance.service";
import type { AttendanceStatus } from "@/features/attendance/types/attendance.types";

export const dynamic = "force-dynamic";

type AdminAttendanceRoutePageProps = {
  searchParams: Promise<{
    date?: string;
    employeeId?: string;
    search?: string;
    status?: string;
  }>;
};

function parseStatus(status: string | undefined): AttendanceStatus | "all" {
  if (
    status === "present" ||
    status === "absent" ||
    status === "late" ||
    status === "half_day" ||
    status === "holiday" ||
    status === "leave" ||
    status === "weekend"
  ) {
    return status;
  }

  return "all";
}

export default async function AdminAttendanceRoutePage({
  searchParams,
}: AdminAttendanceRoutePageProps) {
  const params = await searchParams;
  const filters = {
    date: params.date,
    employeeId: params.employeeId,
    search: params.search,
    status: parseStatus(params.status),
  };
  const [overview, result] = await Promise.all([
    AttendanceService.getAdminOverview(),
    AttendanceService.getAdminList(filters),
  ]);

  return (
    <AdminAttendancePage
      overview={overview}
      result={result}
      filters={filters}
    />
  );
}
