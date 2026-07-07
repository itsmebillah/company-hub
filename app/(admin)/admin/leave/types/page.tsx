import {
  archiveLeaveTypeAction,
  createLeaveTypeAction,
  updateLeaveTypeAction,
} from "@/features/leave/actions/leave.actions";
import { LeaveTypesPage } from "@/features/leave/components";
import { LeaveService } from "@/features/leave/services/leave.service";

export const dynamic = "force-dynamic";

export default async function AdminLeaveTypesPage() {
  const data = await LeaveService.getAdminPageData();

  return (
    <LeaveTypesPage
      leaveTypes={data.leaveTypes}
      onCreate={createLeaveTypeAction}
      onUpdate={updateLeaveTypeAction}
      onArchive={archiveLeaveTypeAction}
    />
  );
}
