export const ROLE_NAMES = {
  admin: "Admin",
  salesHead: "Sales Head",
  rsm: "RSM",
  tso: "TSO",
  sr: "SR",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
