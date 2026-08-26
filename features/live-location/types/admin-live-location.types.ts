export type AdminLiveLocationFreshness = "fresh" | "recent" | "stale";

export type AdminLiveLocation = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  roleName: string | null;
  observedAt: string;
  receivedAt: string;
  updatedAt: string;
  freshness: AdminLiveLocationFreshness;
  accuracyMeters: number;
  latitude: number;
  longitude: number;
};
