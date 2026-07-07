import type { Database } from "@/lib/supabase/types";

export type LeaveRequestStatus =
  Database["public"]["Enums"]["leave_request_status"];
export type LeaveRecordStatus = Database["public"]["Enums"]["record_status"];

export type LeaveTypeItem = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  color: string | null;
  isPaid: boolean;
  annualLimit: number | null;
  requiresApproval: boolean;
  status: LeaveRecordStatus;
};

export type LeaveTypeFormValues = {
  name: string;
  code: string;
  color: string;
  isPaid: boolean;
  annualLimit: string;
  requiresApproval: boolean;
  status: Extract<LeaveRecordStatus, "active" | "inactive">;
};

export type LeaveRequestItem = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeColor: string | null;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: LeaveRequestStatus;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeaveRequestFormValues = {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
};

export type LeaveAdminFilters = {
  search?: string;
  status?: LeaveRequestStatus | "all";
  leaveTypeId?: string;
};

export type LeaveActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

export type LeaveAdminPageData = {
  leaveTypes: LeaveTypeItem[];
  requests: LeaveRequestItem[];
};

export type LeaveEmployeePageData = {
  leaveTypes: LeaveTypeItem[];
  requests: LeaveRequestItem[];
};
