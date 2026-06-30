export const AUTH_REDIRECTS = {
  afterLogin: "/app",
  afterLogout: "/auth/login",
  unauthenticated: "/auth/login",
  authenticatedFromAuthRoute: "/app",
} as const;
