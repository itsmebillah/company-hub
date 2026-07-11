import { redirect } from "next/navigation";

import {
  cancelLeaveRequestAction,
  submitLeaveRequestAction,
} from "@/features/leave/actions/leave.actions";
import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { EmployeeLeavePage } from "@/features/leave/components";
import { LeaveService } from "@/features/leave/services/leave.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const sessionProfile = await getCurrentSessionProfile();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.admin
  ) {
    redirect(getAdminEquivalentPath("/leave"));
  }

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
