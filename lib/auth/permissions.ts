export const ROLE_NAMES = {
  companyAdmin: "Company Admin",
  salesHead: "Sales Head",
  rsm: "RSM",
  tso: "TSO",
  sr: "SR",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
