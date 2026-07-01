export type EmployeeAuthIdentity = {
  id: string;
  employeeId: string;
  authUserId: string | null;
  internalAuthEmail: string | null;
  status: "active" | "inactive" | "archived";
  companyId: string;
  roleId: string;
};

export type AuthSessionProfile = {
  employeeId: string;
  name: string;
  companyId: string;
  roleId: string;
  roleName: string;
  status: "active" | "inactive" | "archived";
};

export type LoginCredentials = {
  employeeId: string;
  password: string;
  rememberMe?: boolean;
};

export type RegistrationInput = {
  employeeId: string;
  password: string;
};

export type PasswordResetInput = {
  employeeId: string;
  redirectTo: string;
};
