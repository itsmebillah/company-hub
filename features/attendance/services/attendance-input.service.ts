import "server-only";

import type { AttendanceCheckInput } from "@/features/attendance/types/attendance.types";

const MAX_NOTES_LENGTH = 1_000;
const MAX_BROWSER_LENGTH = 500;
const MAX_PLATFORM_LENGTH = 100;

function normalizeOptionalText(
  value: string | undefined,
  fieldName: string,
  maxLength: number,
) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
}

export const AttendanceInputService = {
  normalize(input: AttendanceCheckInput) {
    const browser = normalizeOptionalText(
      input.deviceInfo?.browser,
      "Browser information",
      MAX_BROWSER_LENGTH,
    );
    const platform = normalizeOptionalText(
      input.deviceInfo?.platform,
      "Platform information",
      MAX_PLATFORM_LENGTH,
    );

    return {
      notes: normalizeOptionalText(
        input.notes,
        "Attendance notes",
        MAX_NOTES_LENGTH,
      ),
      gps: input.gps,
      selfiePath: input.selfiePath?.trim() || null,
      deviceInfo:
        browser && platform
          ? {
              browser,
              platform,
            }
          : null,
    };
  },
};
