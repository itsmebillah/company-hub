"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { AttendanceMediaSyncService } from "@/features/attendance/services/attendance-media-sync.service";
import { AttendanceService } from "@/features/attendance/services/attendance.service";
import type {
  AttendanceActionState,
  AttendanceCheckInput,
} from "@/features/attendance/types/attendance.types";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

function scheduleAttendanceMediaSync() {
  after(async () => {
    try {
      await AttendanceMediaSyncService.run({ syncLimit: 2, cleanupLimit: 0 });
    } catch (error) {
      console.error("[AttendanceAction] Deferred media worker failed.", {
        errorType: error instanceof Error ? error.name : "unknown_error",
      });
    }
  });
}

export async function prepareCheckInAction(
  input: AttendanceCheckInput = {},
): Promise<AttendanceActionState> {
  try {
    await FeatureAccessService.requireForCurrentCompany("attendance");
    return await AttendanceService.prepareCheckIn(input);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to prepare check-in.",
    };
  }
}

export async function prepareCheckOutAction(
  input: AttendanceCheckInput = {},
): Promise<AttendanceActionState> {
  try {
    await FeatureAccessService.requireForCurrentCompany("attendance");
    return await AttendanceService.prepareCheckOut(input);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to prepare check-out.",
    };
  }
}

export async function checkInAction(
  input: AttendanceCheckInput = {},
): Promise<AttendanceActionState> {
  try {
    await FeatureAccessService.requireForCurrentCompany("attendance");
    await AttendanceService.checkIn(input);
    scheduleAttendanceMediaSync();
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
    await FeatureAccessService.requireForCurrentCompany("attendance");
    await AttendanceService.checkOut(input);
    scheduleAttendanceMediaSync();
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
