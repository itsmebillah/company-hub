export const PERMISSION_ONBOARDING_COMPLETE_EVENT =
  "company-hub:permission-onboarding-complete";

const STORAGE_PREFIX = "company-hub:permission-onboarding";

export function getPermissionOnboardingStorageKey(
  companyId: string,
  version: number,
) {
  return `${STORAGE_PREFIX}:${companyId}:v${version}`;
}

export function isPermissionOnboardingComplete(
  companyId: string,
  version: number,
) {
  try {
    return (
      window.localStorage.getItem(
        getPermissionOnboardingStorageKey(companyId, version),
      ) === "complete"
    );
  } catch {
    return false;
  }
}
