export type EmployeeUiStatus = "active" | "inactive" | "archived";

export type EmployeeUiRecord = {
  id: string;
  employeeId: string;
  name: string;
  roleId: string;
  role: string;
  reportsToId: string;
  reportsTo: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  joiningDate: string;
  status: EmployeeUiStatus;
  photoUrl?: string;
};

export type EmployeeFormMode = "create" | "edit";
