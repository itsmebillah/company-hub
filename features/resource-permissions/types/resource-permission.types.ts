export type PermissionType = "public" | "role" | "employee";

export type PermissionResource = {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  displayOrder: number;
};

export type PermissionRole = {
  id: string;
  name: string;
  displayOrder: number;
};

export type PermissionEmployee = {
  id: string;
  employeeId: string;
  name: string;
  roleId: string;
  roleName: string;
};

export type ResourcePermissionDraft = {
  isPublic: boolean;
  roleIds: string[];
  employeeIds: string[];
};

export type ResourcePermissionState = ResourcePermissionDraft & {
  resourceId: string;
};

export type ResourcePermissionManagementData = {
  resources: PermissionResource[];
  roles: PermissionRole[];
  employees: PermissionEmployee[];
  permissions: ResourcePermissionState[];
};

export type ResourcePermissionActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
