import type { EmployeeRoleName } from "@/features/employees/types/employee.types";

export type HierarchyEmployee = {
  id: string;
  employeeId: string;
  name: string;
  roleId: string;
  roleName: EmployeeRoleName;
  managerId: string | null;
  status: "active" | "inactive" | "archived";
};

export type HierarchyNode = HierarchyEmployee & {
  children: HierarchyNode[];
};

export type HierarchyProfile = HierarchyEmployee & {
  reportsTo: string | null;
  directReports: HierarchyEmployee[];
  hierarchyPath: HierarchyEmployee[];
};

export type ChangeManagerInput = {
  employeeId: string;
  managerId: string;
};

export type BulkReassignInput = {
  employeeIds: string[];
  managerId: string;
};

export type HierarchyActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
