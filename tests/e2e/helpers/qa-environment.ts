type QaEnvironment = {
  supabaseUrl: string;
  serviceRoleKey: string;
  adminEmployeeId: string;
  employeeEmployeeId: string;
};

function requireEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Authenticated QA requires ${name}. Copy .env.test.example to an ignored .env.test.local file and provide the QA-only value.`,
    );
  }

  return value;
}

export function getQaEnvironment(): QaEnvironment {
  const supabaseUrl = requireEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnvironmentVariable(
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const expectedProjectRef = requireEnvironmentVariable(
    "PLAYWRIGHT_QA_PROJECT_REF",
  );
  const adminEmployeeId = requireEnvironmentVariable(
    "PLAYWRIGHT_QA_ADMIN_EMPLOYEE_ID",
  ).toUpperCase();
  const employeeEmployeeId = requireEnvironmentVariable(
    "PLAYWRIGHT_QA_EMPLOYEE_ID",
  ).toUpperCase();

  if (process.env.PLAYWRIGHT_ALLOW_QA_MUTATIONS !== "true") {
    throw new Error(
      "Authenticated QA mutates and cleans up test data. Set PLAYWRIGHT_ALLOW_QA_MUTATIONS=true only for an isolated QA Supabase project.",
    );
  }

  let actualProjectRef: string;

  try {
    actualProjectRef = new URL(supabaseUrl).hostname.split(".")[0] ?? "";
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }

  if (actualProjectRef !== expectedProjectRef) {
    throw new Error(
      "Authenticated QA project mismatch: PLAYWRIGHT_QA_PROJECT_REF does not match NEXT_PUBLIC_SUPABASE_URL.",
    );
  }

  if (adminEmployeeId === employeeEmployeeId) {
    throw new Error(
      "Authenticated QA requires different Company Admin and employee accounts.",
    );
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    adminEmployeeId,
    employeeEmployeeId,
  };
}
