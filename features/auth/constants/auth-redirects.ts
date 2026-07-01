export const AUTH_REDIRECTS = {
  afterLogin: "/dashboard",
  afterLogout: "/login",
  unauthenticated: "/login",
  authenticatedFromAuthRoute: "/dashboard",
} as const;
