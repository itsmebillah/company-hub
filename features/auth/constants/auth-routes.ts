export const AUTH_ROUTES = {
  login: "/auth/login",
  register: "/auth/register",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
} as const;

export const PROTECTED_ROUTE_PREFIXES = ["/app"] as const;
export const PUBLIC_ROUTE_PREFIXES = ["/auth"] as const;
