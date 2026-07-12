import { formatAppTime, getAppDateTime } from "@/lib/datetime";

const TIME_VALUE_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const REFERENCE_DATE = "2000-01-01";

export function isValidTimeValue(value: string) {
  return TIME_VALUE_PATTERN.test(value);
}

export function parseTimeValueToMinutes(value: string) {
  const match = TIME_VALUE_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

export function addMinutesToTimeValue(value: string, minutes: number) {
  const baseMinutes = parseTimeValueToMinutes(value);

  if (baseMinutes === null || !Number.isFinite(minutes)) {
    return null;
  }

  const nextMinutes = ((baseMinutes + minutes) % 1440 + 1440) % 1440;
  const hours = Math.floor(nextMinutes / 60);
  const remainingMinutes = nextMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

export function formatTimeValueLabel(value: string) {
  if (!isValidTimeValue(value)) {
    return value;
  }

  return formatAppTime(getAppDateTime(REFERENCE_DATE, value));
}
