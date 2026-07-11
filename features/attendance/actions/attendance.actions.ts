"use server";

import { revalidatePath } from "next/cache";

import { AttendanceService } from "@/features/attendance/services/attendance.service";
import type {
  AttendanceActionState,
  AttendanceCheckInput,
} from "@/features/attendance/types/attendance.types";

export async function prepareCheckInAction(
  input: AttendanceCheckInput = {},
): Promise<AttendanceActionState> {
  try {
    return await AttendanceService.prepareCheckIn(input);
  } catch (error) {
    console.error("[AttendanceAction] Prepare check-in failed.", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to prepare check-in.",
    };
  }
}

export async function prepareCheckOutAction(
  input: AttendanceCheckInput = {},
): Promise<AttendanceActionState> {
  try {
    return await AttendanceService.prepareCheckOut(input);
  } catch (error) {
    console.error("[AttendanceAction] Prepare check-out failed.", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to prepare check-out.",
    };
  }
}

export async function checkInAction(
  input: AttendanceCheckInput = {},
): Promise<AttendanceActionState> {
  try {
    await AttendanceService.checkIn(input);
    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/attendance");

    return {
      ok: true,
      message: "Checked in successfully.",
    };
  } catch (error) {
    console.error("[AttendanceAction] Check-in failed.", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to check in. Please try again.",
    };
  }
}

export async function checkOutAction(
  input: AttendanceCheckInput = {},
): Promise<AttendanceActionState> {
  try {
    await AttendanceService.checkOut(input);
    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/attendance");

    return {
      ok: true,
      message: "Checked out successfully.",
    };
  } catch (error) {
    console.error("[AttendanceAction] Check-out failed.", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to check out. Please try again.",
    };
  }
}
