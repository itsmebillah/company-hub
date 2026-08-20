export type ConfigurationStatus = "CONFIGURED" | "MISSING" | "INVALID";

export type ConfigurationCheck = {
  name: string;
  status: ConfigurationStatus;
  nextStep?: string;
};

export const LOCAL_CONFIGURATION_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_DB_URL",
  "CRON_SECRET",
  "GOOGLE_SERVICE_ACCOUNT_KEY_FILE",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "GOOGLE_DRIVE_OAUTH_CLIENT_FILE",
  "GOOGLE_DRIVE_OAUTH_CLIENT_ID",
  "GOOGLE_DRIVE_OAUTH_CLIENT_SECRET",
  "GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN",
  "GOOGLE_DRIVE_SELFIES_FOLDER_ID",
  "GOOGLE_DRIVE_PICKER_API_KEY",
  "GOOGLE_DRIVE_PICKER_APP_ID",
  "GOOGLE_SHEETS_REPORTING_SPREADSHEET_ID",
  "GOOGLE_SHEETS_REPORTING_COMPANY_ID",
] as const;

export type LocalConfigurationKey = (typeof LOCAL_CONFIGURATION_KEYS)[number];

const PLACEHOLDER_PATTERN =
  /(?:^|[\\/:@])(?:your-|replace(?:-with)?|placeholder|example|changeme|todo|xxx|\.\.\.|generate-a-|secure-path)|^<.*>$|^0{8}-0{4}-0{4}-0{4}-0{12}$/i;

export function normalizeEnvironmentValue(value: string | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"')))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function isActualValue(value: string | undefined) {
  const normalized = normalizeEnvironmentValue(value);
  return Boolean(normalized && !PLACEHOLDER_PATTERN.test(normalized));
}

export function parseDotEnv(contents: string) {
  const result: Partial<Record<LocalConfigurationKey, string>> = {};
  const allowed = new Set<string>(LOCAL_CONFIGURATION_KEYS);
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=(.*)$/);
    if (!match || !allowed.has(match[1])) continue;
    result[match[1] as LocalConfigurationKey] = normalizeEnvironmentValue(
      match[2],
    );
  }
  return result;
}

export function encodeDotEnvValue(value: string) {
  return `'${value.replaceAll("'", "\\'")}'`;
}

export function mergeKnownConfiguration(
  destination: string,
  source: Partial<Record<LocalConfigurationKey, string>>,
  replaceExisting = false,
) {
  const lines = destination ? destination.split(/\r?\n/) : [];
  const indexes = new Map<string, number>();
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
    if (match) indexes.set(match[1], index);
  }

  for (const key of LOCAL_CONFIGURATION_KEYS) {
    const sourceValue = source[key];
    if (!isActualValue(sourceValue)) continue;
    const existingIndex = indexes.get(key);
    if (existingIndex !== undefined) {
      const existingValue = normalizeEnvironmentValue(
        lines[existingIndex].split("=", 2)[1],
      );
      if (!replaceExisting && isActualValue(existingValue)) continue;
      lines[existingIndex] = `${key}=${encodeDotEnvValue(sourceValue!)}`;
    } else {
      indexes.set(key, lines.length);
      lines.push(`${key}=${encodeDotEnvValue(sourceValue!)}`);
    }
  }

  return `${lines
    .filter((line, index) => line || index < lines.length - 1)
    .join("\n")
    .trimEnd()}\n`;
}

export function getOAuthProjectNumber(clientId: string | undefined) {
  const match = normalizeEnvironmentValue(clientId)?.match(/^(\d+)-/);
  return match?.[1] ?? null;
}

export function checkValue(
  name: string,
  value: string | undefined,
  validator: (value: string) => boolean,
  nextStep: string,
): ConfigurationCheck {
  if (!isActualValue(value)) return { name, status: "MISSING", nextStep };
  return validator(normalizeEnvironmentValue(value)!)
    ? { name, status: "CONFIGURED" }
    : { name, status: "INVALID", nextStep };
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
