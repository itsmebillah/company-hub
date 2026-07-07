export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  setup: "/setup",
} as const;

export const PROTECTED_ROUTE_PREFIXES = [
  "/admin",
  "/announcements",
  "/attendance",
  "/calendar",
  "/dashboard",
  "/leave",
  "/profile",
  "/resources",
  "/settings",
] as const;
export const PUBLIC_ROUTE_PREFIXES = ["/login", "/register"] as const;
