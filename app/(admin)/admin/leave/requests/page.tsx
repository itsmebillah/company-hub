import {
  approveLeaveRequestAction,
  rejectLeaveRequestAction,
} from "@/features/leave/actions/leave.actions";
import { LeaveRequestsPage } from "@/features/leave/components";
import { LeaveService } from "@/features/leave/services/leave.service";
import type { LeaveRequestStatus } from "@/features/leave/types/leave.types";

export const dynamic = "force-dynamic";

type AdminLeaveRequestsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    leaveTypeId?: string;
  }>;
};

function parseStatus(status: string | undefined): LeaveRequestStatus | "all" {
  if (
    status === "pending" ||
    status === "approved" ||
    status === "rejected" ||
    status === "cancelled"
  ) {
    return status;
  }

  return "all";
}

export default async function AdminLeaveRequestsPage({
  searchParams,
}: AdminLeaveRequestsPageProps) {
  const params = await searchParams;
  const filters = {
    search: params.search,
    status: parseStatus(params.status),
    leaveTypeId: params.leaveTypeId,
  };
  const data = await LeaveService.getAdminPageData(filters);

  return (
    <LeaveRequestsPage
      requests={data.requests}
      leaveTypes={data.leaveTypes}
      filters={{
        search: params.search ?? "",
        status: params.status ?? "all",
        leaveTypeId: params.leaveTypeId ?? "",
      }}
      onApprove={approveLeaveRequestAction}
      onReject={rejectLeaveRequestAction}
    />
  );
}
