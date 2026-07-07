import "server-only";

import { redirect } from "next/navigation";

import { logActivity } from "@/features/activity/utils/activity-log";
import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { CalendarService } from "@/features/company-calendar/services/calendar.service";
import type {
  LeaveAdminFilters,
  LeaveAdminPageData,
  LeaveEmployeePageData,
  LeaveRequestFormValues,
  LeaveRequestItem,
  LeaveRequestStatus,
  LeaveTypeFormValues,
  LeaveTypeItem,
} from "@/features/leave/types/leave.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOW_PAST_LEAVE_REQUESTS = false;

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function getCurrentEmployee() {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_id, name, company_id, manager_id, status")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !data || data.status !== "active") {
    redirect("/login");
  }

  return data;
}

async function getActiveCompanyId() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("[LeaveService] Unable to load company.", error);
    throw new Error("Unable to load company information.");
  }

  const companyId = data[0]?.id;

  if (!companyId) {
    throw new Error("Company was not found.");
  }

  return companyId;
}

function toLeaveType(row: {
  id: string;
  company_id: string;
  name: string;
  code: string;
  color: string | null;
  is_paid: boolean;
  annual_limit: number | null;
  requires_approval: boolean;
  status: LeaveTypeItem["status"];
}): LeaveTypeItem {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    code: row.code,
    color: row.color,
    isPaid: row.is_paid,
    annualLimit: row.annual_limit,
    requiresApproval: row.requires_approval,
    status: row.status,
  };
}

type LeaveRequestRow = {
  id: string;
  company_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: LeaveRequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  employees:
    | { employee_id: string; name: string }
    | Array<{ employee_id: string; name: string }>;
  leave_types:
    | { name: string; color: string | null }
    | Array<{ name: string; color: string | null }>;
  approver?: { name: string } | Array<{ name: string }> | null;
};

function toLeaveRequest(row: LeaveRequestRow): LeaveRequestItem {
  const employee = Array.isArray(row.employees) ? row.employees[0] : row.employees;
  const leaveType = Array.isArray(row.leave_types)
    ? row.leave_types[0]
    : row.leave_types;
  const approver = Array.isArray(row.approver) ? row.approver[0] : row.approver;

  return {
    id: row.id,
    companyId: row.company_id,
    employeeId: row.employee_id,
    employeeName: employee?.name ?? "Unknown",
    employeeCode: employee?.employee_id ?? "Unknown",
    leaveTypeId: row.leave_type_id,
    leaveTypeName: leaveType?.name ?? "Unknown",
    leaveTypeColor: leaveType?.color ?? null,
    startDate: row.start_date,
    endDate: row.end_date,
    totalDays: row.total_days,
    reason: row.reason,
    status: row.status,
    approvedBy: row.approved_by,
    approvedByName: approver?.name ?? null,
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateLeaveType(values: LeaveTypeFormValues) {
  if (!values.name.trim()) {
    throw new Error("Leave type name is required.");
  }

  if (!values.code.trim()) {
    throw new Error("Leave type code is required.");
  }

  if (values.annualLimit.trim()) {
    const annualLimit = Number(values.annualLimit);

    if (!Number.isInteger(annualLimit) || annualLimit < 0) {
      throw new Error("Annual limit must be a positive whole number.");
    }
  }
}

async function validateLeaveRequest(
  values: LeaveRequestFormValues,
  companyId: string,
  employeeId: string,
  currentRequestId?: string,
) {
  if (!values.leaveTypeId) {
    throw new Error("Leave type is required.");
  }

  if (!values.startDate || !values.endDate) {
    throw new Error("Start date and end date are required.");
  }

  if (values.endDate < values.startDate) {
    throw new Error("End date must be after start date.");
  }

  if (!ALLOW_PAST_LEAVE_REQUESTS && values.startDate < getTodayDate()) {
    throw new Error("Leave cannot be submitted for a past date.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: leaveType, error: typeError } = await supabase
    .from("leave_types")
    .select("id")
    .eq("id", values.leaveTypeId)
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle();

  if (typeError || !leaveType) {
    throw new Error("Leave type is invalid.");
  }

  let overlapQuery = supabase
    .from("leave_requests")
    .select("id")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .in("status", ["pending", "approved"])
    .lte("start_date", values.endDate)
    .gte("end_date", values.startDate)
    .limit(1);

  if (currentRequestId) {
    overlapQuery = overlapQuery.neq("id", currentRequestId);
  }

  const { data: overlaps, error: overlapError } = await overlapQuery;

  if (overlapError) {
    console.error("[LeaveService] Unable to validate overlap.", overlapError);
    throw new Error("Unable to validate leave request.");
  }

  if (overlaps.length > 0) {
    throw new Error("A leave request already exists for these dates.");
  }
}

async function listLeaveTypes(companyId: string, activeOnly = false) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("leave_types")
    .select(
      "id, company_id, name, code, color, is_paid, annual_limit, requires_approval, status",
    )
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("status", "active");
  } else {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    console.error("[LeaveService] Unable to load leave types.", error);
    throw new Error("Unable to load leave types.");
  }

  return data.map(toLeaveType);
}

async function listRequests(companyId: string, filters: LeaveAdminFilters = {}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("leave_requests")
    .select(
      "id, company_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at, rejection_reason, created_at, updated_at, employees!leave_requests_employee_id_fkey!inner(employee_id, name), leave_types!inner(name, color), approver:employees!leave_requests_approved_by_fkey(name)",
    )
    .eq("company_id", companyId);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.leaveTypeId) {
    query = query.eq("leave_type_id", filters.leaveTypeId);
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    query = query.or(
      `employee_id.ilike.%${search}%,name.ilike.%${search}%`,
      { foreignTable: "employees" },
    );
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("[LeaveService] Unable to load leave requests.", error);
    throw new Error("Unable to load leave requests.");
  }

  return (data as unknown as LeaveRequestRow[]).map(toLeaveRequest);
}

async function listEmployeeRequests(companyId: string, employeeId: string) {
  const requests = await listRequests(companyId);

  return requests.filter((request) => request.employeeId === employeeId);
}

export const LeaveService = {
  async getAdminPageData(filters: LeaveAdminFilters = {}): Promise<LeaveAdminPageData> {
    const companyId = await getActiveCompanyId();
    const [leaveTypes, requests] = await Promise.all([
      listLeaveTypes(companyId),
      listRequests(companyId, filters),
    ]);

    return { leaveTypes, requests };
  },

  async getEmployeePageData(): Promise<LeaveEmployeePageData> {
    const employee = await getCurrentEmployee();
    const [leaveTypes, requests] = await Promise.all([
      listLeaveTypes(employee.company_id, true),
      listEmployeeRequests(employee.company_id, employee.id),
    ]);

    return { leaveTypes, requests };
  },

  async createLeaveType(values: LeaveTypeFormValues) {
    validateLeaveType(values);

    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();
    const annualLimit = values.annualLimit.trim()
      ? Number(values.annualLimit)
      : null;
    const { error } = await supabase.from("leave_types").insert({
      company_id: companyId,
      name: values.name.trim(),
      code: normalizeCode(values.code),
      color: normalizeOptional(values.color),
      is_paid: values.isPaid,
      annual_limit: annualLimit,
      requires_approval: values.requiresApproval,
      status: values.status,
    });

    if (error) {
      console.error("[LeaveService] Unable to create leave type.", error);
      throw new Error("Unable to create leave type.");
    }
  },

  async updateLeaveType(id: string, values: LeaveTypeFormValues) {
    validateLeaveType(values);

    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();
    const annualLimit = values.annualLimit.trim()
      ? Number(values.annualLimit)
      : null;
    const { error } = await supabase
      .from("leave_types")
      .update({
        name: values.name.trim(),
        code: normalizeCode(values.code),
        color: normalizeOptional(values.color),
        is_paid: values.isPaid,
        annual_limit: annualLimit,
        requires_approval: values.requiresApproval,
        status: values.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      console.error("[LeaveService] Unable to update leave type.", error);
      throw new Error("Unable to update leave type.");
    }
  },

  async archiveLeaveType(id: string) {
    const companyId = await getActiveCompanyId();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("leave_types")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("Unable to archive leave type.");
    }
  },

  async submitLeaveRequest(values: LeaveRequestFormValues) {
    const employee = await getCurrentEmployee();
    await validateLeaveRequest(values, employee.company_id, employee.id);

    const totalDays = await CalendarService.countWorkingDays(
      employee.company_id,
      values.startDate,
      values.endDate,
    );

    if (totalDays <= 0) {
      throw new Error("Selected dates do not include any working days.");
    }
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        company_id: employee.company_id,
        employee_id: employee.id,
        leave_type_id: values.leaveTypeId,
        start_date: values.startDate,
        end_date: values.endDate,
        total_days: totalDays,
        reason: normalizeOptional(values.reason),
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[LeaveService] Unable to submit leave request.", error);
      throw new Error("Unable to submit leave request.");
    }

    await logActivity({
      companyId: employee.company_id,
      module: "leave",
      action: "created",
      entityType: "leave_requests",
      entityId: data.id,
      description: `${employee.name} submitted a leave request`,
    });

    if (employee.manager_id) {
      await NotificationService.create({
        companyId: employee.company_id,
        employeeId: employee.manager_id,
        type: "leave",
        title: "Leave request submitted",
        message: `${employee.name} submitted a leave request for ${totalDays} day(s).`,
        actionUrl: "/admin/leave/requests",
      });
    }
  },

  async approveLeaveRequest(id: string) {
    const approver = await getCurrentEmployee();
    const supabase = createSupabaseAdminClient();
    const { data: request, error: requestError } = await supabase
      .from("leave_requests")
      .select("id, employee_id, company_id, status")
      .eq("id", id)
      .eq("company_id", approver.company_id)
      .single();

    if (requestError || !request || request.status !== "pending") {
      throw new Error("Leave request cannot be approved.");
    }

    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "approved",
        approved_by: approver.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error("Unable to approve leave request.");
    }

    await NotificationService.create({
      companyId: approver.company_id,
      employeeId: request.employee_id,
      type: "leave",
      title: "Leave approved",
      message: "Your leave request was approved.",
      actionUrl: "/leave",
    });
    await logActivity({
      companyId: approver.company_id,
      module: "leave",
      action: "approved",
      entityType: "leave_requests",
      entityId: id,
      description: `${approver.name} approved a leave request`,
    });
  },

  async rejectLeaveRequest(id: string, reason: string) {
    if (!reason.trim()) {
      throw new Error("Rejection reason is required.");
    }

    const approver = await getCurrentEmployee();
    const supabase = createSupabaseAdminClient();
    const { data: request, error: requestError } = await supabase
      .from("leave_requests")
      .select("id, employee_id, company_id, status")
      .eq("id", id)
      .eq("company_id", approver.company_id)
      .single();

    if (requestError || !request || request.status !== "pending") {
      throw new Error("Leave request cannot be rejected.");
    }

    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "rejected",
        approved_by: approver.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error("Unable to reject leave request.");
    }

    await NotificationService.create({
      companyId: approver.company_id,
      employeeId: request.employee_id,
      type: "leave",
      title: "Leave rejected",
      message: "Your leave request was rejected.",
      actionUrl: "/leave",
    });
    await logActivity({
      companyId: approver.company_id,
      module: "leave",
      action: "rejected",
      entityType: "leave_requests",
      entityId: id,
      description: `${approver.name} rejected a leave request`,
    });
  },

  async cancelLeaveRequest(id: string) {
    const employee = await getCurrentEmployee();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("employee_id", employee.id)
      .eq("company_id", employee.company_id)
      .eq("status", "pending");

    if (error) {
      throw new Error("Unable to cancel leave request.");
    }

    await logActivity({
      companyId: employee.company_id,
      module: "leave",
      action: "cancelled",
      entityType: "leave_requests",
      entityId: id,
      description: `${employee.name} cancelled a leave request`,
    });
  },
};
