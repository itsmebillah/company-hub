const SUPABASE_MINIMUM_PASSWORD_LENGTH = 6;

/**
 * Converts the Employee-ID password entered by a user into the credential
 * stored by Supabase. The caller must pass the normalized Employee ID or the
 * password exactly as entered; padding is an internal Auth detail only.
 */
export function toSupabaseEmployeePassword(value: string) {
  return value.padStart(SUPABASE_MINIMUM_PASSWORD_LENGTH, "0");
}
