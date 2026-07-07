import {
  cancelLeaveRequestAction,
  submitLeaveRequestAction,
} from "@/features/leave/actions/leave.actions";
import { EmployeeLeavePage } from "@/features/leave/components";
import { LeaveService } from "@/features/leave/services/leave.service";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const data = await LeaveService.getEmployeePageData();

  return (
    <EmployeeLeavePage
      leaveTypes={data.leaveTypes}
      requests={data.requests}
      onSubmitRequest={submitLeaveRequestAction}
      onCancelRequest={cancelLeaveRequestAction}
    />
  );
}
