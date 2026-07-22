"use server";

import { revalidatePath } from "next/cache";

import { LeaveService } from "@/features/leave/services/leave.service";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import type {
  LeaveActionState,
  LeaveRequestFormValues,
  LeaveTypeFormValues,
} from "@/features/leave/types/leave.types";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

function actionError(error: unknown, fallback: string): LeaveActionState {
  return {
    ok: false,
    message: error instanceof Error ? error.message : fallback,
  };
}

export async function createLeaveTypeAction(
  values: LeaveTypeFormValues,
): Promise<LeaveActionState> {
  try {
    await requireCompanyAdmin("leave");
    await LeaveService.createLeaveType(values);
    revalidatePath("/admin/leave/types");
    return { ok: true, message: "Leave type created." };
  } catch (error) {
    return actionError(error, "Unable to create leave type.");
  }
}

export async function updateLeaveTypeAction(
  id: string,
  values: LeaveTypeFormValues,
): Promise<LeaveActionState> {
  try {
    await requireCompanyAdmin("leave");
    await LeaveService.updateLeaveType(id, values);
    revalidatePath("/admin/leave/types");
    return { ok: true, message: "Leave type updated." };
  } catch (error) {
    return actionError(error, "Unable to update leave type.");
  }
}

export async function archiveLeaveTypeAction(
  id: string,
): Promise<LeaveActionState> {
  try {
    await requireCompanyAdmin("leave");
    await LeaveService.archiveLeaveType(id);
    revalidatePath("/admin/leave/types");
    return { ok: true, message: "Leave type archived." };
  } catch (error) {
    return actionError(error, "Unable to archive leave type.");
  }
}

export async function submitLeaveRequestAction(
  values: LeaveRequestFormValues,
): Promise<LeaveActionState> {
  try {
    await FeatureAccessService.requireForCurrentCompany("leave");
    await LeaveService.submitLeaveRequest(values);
    revalidatePath("/leave");
    revalidatePath("/admin/leave/requests");
    return { ok: true, message: "Leave request submitted." };
  } catch (error) {
    return actionError(error, "Unable to submit leave request.");
  }
}

export async function approveLeaveRequestAction(
  id: string,
  values?: LeaveRequestFormValues,
): Promise<LeaveActionState> {
  try {
    await requireCompanyAdmin("leave");
    await LeaveService.approveLeaveRequest(id, values);
    revalidatePath("/admin/leave/requests");
    return { ok: true, message: "Leave request approved." };
  } catch (error) {
    return actionError(error, "Unable to approve leave request.");
  }
}

export async function rejectLeaveRequestAction(
  id: string,
  reason: string,
): Promise<LeaveActionState> {
  try {
    await requireCompanyAdmin("leave");
    await LeaveService.rejectLeaveRequest(id, reason);
    revalidatePath("/admin/leave/requests");
    return { ok: true, message: "Leave request rejected." };
  } catch (error) {
    return actionError(error, "Unable to reject leave request.");
  }
}

export async function cancelLeaveRequestAction(
  id: string,
): Promise<LeaveActionState> {
  try {
    await FeatureAccessService.requireForCurrentCompany("leave");
    await LeaveService.cancelLeaveRequest(id);
    revalidatePath("/leave");
    return { ok: true, message: "Leave request cancelled." };
  } catch (error) {
    return actionError(error, "Unable to cancel leave request.");
  }
}
