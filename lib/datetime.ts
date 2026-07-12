const APP_TIME_ZONE = "Asia/Dhaka";
const APP_TIME_ZONE_OFFSET = "+06:00";

type DateTimeFormatterOptions = Intl.DateTimeFormatOptions;

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function getParts(
  value: string | Date,
  options: DateTimeFormatterOptions,
) {
  return getPartsForTimeZone(value, APP_TIME_ZONE, options);
}

function getPartsForTimeZone(
  value: string | Date,
  timeZone: string,
  options: DateTimeFormatterOptions,
) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    ...options,
  }).formatToParts(toDate(value));
}

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function getAppTimeZone() {
  return APP_TIME_ZONE;
}

export function normalizeTimeZone(value: string | null | undefined) {
  if (!value?.trim()) {
    return APP_TIME_ZONE;
  }

  try {
    new Intl.DateTimeFormat("en", { timeZone: value.trim() }).format(new Date());
    return value.trim();
  } catch {
    return APP_TIME_ZONE;
  }
}

export function getAppDateTime(dateString: string, timeString: string) {
  const normalizedTime = /^\d{2}:\d{2}$/.test(timeString)
    ? `${timeString}:00`
    : timeString;

  return new Date(`${dateString}T${normalizedTime}${APP_TIME_ZONE_OFFSET}`);
}

export function getAppDateString(value: string | Date = new Date()) {
  const parts = getParts(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}`;
}

export function getTimeZoneDateString(
  timeZone: string,
  value: string | Date = new Date(),
) {
  const parts = getPartsForTimeZone(value, normalizeTimeZone(timeZone), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}`;
}

export function getTimeZoneHour(
  timeZone: string,
  value: string | Date = new Date(),
) {
  const parts = getPartsForTimeZone(value, normalizeTimeZone(timeZone), {
    hour: "2-digit",
    hour12: false,
  });

  return Number(getPart(parts, "hour") || "0");
}

export function shiftAppDateString(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const shiftedDate = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = shiftedDate.getUTCFullYear();
  const nextMonth = String(shiftedDate.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(shiftedDate.getUTCDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function formatAppDate(
  value: string | Date,
  options: DateTimeFormatterOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
) {
  return new Intl.DateTimeFormat("en", {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(toDate(value));
}

export function formatAppTime(
  value: string | Date,
  options: DateTimeFormatterOptions = {
    hour: "numeric",
    minute: "2-digit",
  },
) {
  return new Intl.DateTimeFormat("en", {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(toDate(value));
}

export function formatAppDateTime(
  value: string | Date,
  options: DateTimeFormatterOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
) {
  return new Intl.DateTimeFormat("en", {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(toDate(value));
}
