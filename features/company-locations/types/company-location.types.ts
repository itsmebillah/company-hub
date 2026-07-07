import type { Database } from "@/lib/supabase/types";

export type CompanyLocationType =
  Database["public"]["Enums"]["company_location_type"];
export type CompanyLocationStatus =
  Database["public"]["Enums"]["record_status"];

export type CompanyLocationEmployeeOption = {
  id: string;
  employeeId: string;
  name: string;
};

export type CompanyLocationListItem = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  locationType: CompanyLocationType;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string | null;
  status: CompanyLocationStatus;
  isDefault: boolean;
  assignedEmployeeIds: string[];
};

export type CompanyLocationFormValues = {
  name: string;
  code: string;
  locationType: CompanyLocationType;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  address: string;
  status: Extract<CompanyLocationStatus, "active" | "inactive">;
  isDefault: boolean;
  assignedEmployeeIds: string[];
};

export type CompanyLocationActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

export type CompanyLocationsPageData = {
  locations: CompanyLocationListItem[];
  employees: CompanyLocationEmployeeOption[];
};
