import "server-only";

import { AttendanceRepository } from "@/features/attendance/repositories/attendance.repository";
import { getAttendanceSelfieStorage } from "@/features/attendance/storage/attendance-selfie-storage.provider";
import type { StoredAttendanceSelfie } from "@/features/attendance/storage/attendance-selfie-storage";
import { requireCurrentEmployeeContext } from "@/features/auth/services/current-employee-context.service";
import { getAppDateString } from "@/lib/datetime";
import { buildAttendanceSelfiePath } from "@/lib/media";

const MAX_SELFIE_SIZE_BYTES = 5 * 1024 * 1024;
const READ_URL_TTL_SECONDS = 60 * 10;
const SUPPORTED_SELFIE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

type AttendanceSelfiePhase = "checkin" | "checkout";
const selfieStorage = getAttendanceSelfieStorage();

function getImageExtension(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}

function hasSupportedImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }

  if (mimeType === "image/heic" || mimeType === "image/heif") {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    return (
      String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" &&
      ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)
    );
  }

  return false;
}

function assertCurrentAttendanceDate(attendanceDate: string) {
  if (attendanceDate !== getAppDateString()) {
    throw new Error("Attendance selfies can only be uploaded for today.");
  }
}

async function assertPhaseIsOpen(input: {
  employeeId: string;
  attendanceDate: string;
  phase: AttendanceSelfiePhase;
}) {
  const record = await AttendanceRepository.findByEmployeeDate(
    input.employeeId,
    input.attendanceDate,
  );

  if (input.phase === "checkin" && record) {
    throw new Error("Attendance already exists for today.");
  }

  if (input.phase === "checkout" && !record?.checkIn) {
    throw new Error("Check in before uploading a checkout selfie.");
  }

  if (input.phase === "checkout" && record?.checkOut) {
    throw new Error("Attendance is already completed for today.");
  }
}

function buildOwnedPathPrefix(input: {
  companyId: string;
  employeeId: string;
  attendanceDate: string;
}) {
  const [year, month, day] = input.attendanceDate.split("-");
  return `${input.companyId}/${input.employeeId}/${year}/${month}/${day}/`;
}

function assertOwnedReference(input: {
  path: string;
  companyId: string;
  employeeId: string;
  attendanceDate: string;
  phase: AttendanceSelfiePhase;
}) {
  const expectedPrefix = buildOwnedPathPrefix(input);
  const fileName = input.path.slice(expectedPrefix.length);
  const expectedFileName = new RegExp(
    `^${input.phase}(?:-[0-9a-f-]{36})?\\.(?:jpg|png|webp|heic|heif)$`,
    "i",
  );

  if (
    !input.path.startsWith(expectedPrefix) ||
    !expectedFileName.test(fileName)
  ) {
    throw new Error("Attendance selfie reference is invalid.");
  }

  return input.path;
}

export const AttendanceSelfieService = {
  async upload(input: {
    file: File;
    phase: AttendanceSelfiePhase;
    attendanceDate: string;
  }): Promise<StoredAttendanceSelfie> {
    assertCurrentAttendanceDate(input.attendanceDate);

    if (!SUPPORTED_SELFIE_TYPES.has(input.file.type)) {
      throw new Error("Please capture a JPG, PNG, WebP, HEIC, or HEIF selfie.");
    }

    if (input.file.size <= 0 || input.file.size > MAX_SELFIE_SIZE_BYTES) {
      throw new Error("Selfie image must be between 1 byte and 5 MB.");
    }

    const employee = await requireCurrentEmployeeContext();
    await assertPhaseIsOpen({
      employeeId: employee.id,
      attendanceDate: input.attendanceDate,
      phase: input.phase,
    });

    const data = await input.file.arrayBuffer();
    const bytes = new Uint8Array(data.slice(0, 16));

    if (!hasSupportedImageSignature(bytes, input.file.type)) {
      throw new Error("The selected file is not a valid supported image.");
    }

    const objectPath = buildAttendanceSelfiePath({
      companyId: employee.companyId,
      employeeId: employee.employeeId,
      attendanceDate: input.attendanceDate,
      phase: input.phase,
      objectId: crypto.randomUUID(),
      extension: getImageExtension(input.file.type),
    });

    return selfieStorage.upload({
      objectPath,
      data,
      contentType: input.file.type,
    });
  },

  async requireOwnedReference(input: {
    path: string;
    companyId: string;
    employeeId: string;
    attendanceDate: string;
    phase: AttendanceSelfiePhase;
  }) {
    const path = assertOwnedReference(input);

    if (!(await selfieStorage.exists(path))) {
      throw new Error("Attendance selfie could not be verified.");
    }

    return path;
  },

  async getSignedUrl(path: string) {
    return selfieStorage.createReadUrl(path, READ_URL_TTL_SECONDS);
  },
};
