import type { Database } from "@/lib/supabase/types";

export type EmployeeStatus = Database["public"]["Enums"]["record_status"];

export type EmployeeRoleName = "Admin" | "Sales Head" | "RSM" | "TSO" | "SR";

export type EmployeeRoleOption = {
  id: string;
  name: EmployeeRoleName;
  displayOrder: number;
};

export type EmployeeManagerOption = {
  id: string;
  employeeId: string;
  name: string;
  roleId: string;
  roleName: EmployeeRoleName;
};

export type EmployeeListItem = {
  id: string;
  employeeId: string;
  name: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  roleId: string;
  roleName: string;
  managerId: string | null;
  managerName: string | null;
  status: EmployeeStatus;
  joiningDate: string | null;
};

export type EmployeeDetails = EmployeeListItem & {
  dateOfBirth: string | null;
  companyId: string;
  roleId: string;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeFormValues = {
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  joiningDate: string;
  roleId: string;
  managerId: string;
  status: EmployeeStatus;
};

export type EmployeeListFilters = {
  search?: string;
  status?: EmployeeStatus | "all";
  roleId?: string;
  managerId?: string;
  page?: number;
  pageSize?: number;
};

export type EmployeeListResult = {
  employees: EmployeeListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type EmployeeActionState =
  | {
      ok: true;
      message: string;
      redirectTo?: string;
    }
  | {
      ok: false;
      message: string;
    };
