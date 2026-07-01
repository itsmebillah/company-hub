import type { ResourceOpenMode, ResourceType } from "@/features/resources/types/resource.types";

export type EmployeeResourceProfile = {
  employeeId: string;
  employeeName: string;
  roleName: string;
  companyName: string;
  companyLogo: string | null;
};

export type EmployeePortalResource = {
  id: string;
  title: string;
  description: string;
  resourceType: ResourceType;
  url: string;
  icon: string;
  thumbnail: string;
  openMode: ResourceOpenMode;
  isFeatured: boolean;
};

export type EmployeePortalCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  resources: EmployeePortalResource[];
};

export type EmployeeResourcePortalData = {
  profile: EmployeeResourceProfile;
  categories: EmployeePortalCategory[];
};
