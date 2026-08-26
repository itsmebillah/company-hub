import "server-only";

import { redirect } from "next/navigation";

import { requireCurrentCompanyId } from "@/features/auth/services/current-company-context.service";
import { requireCurrentEmployeeContext } from "@/features/auth/services/current-employee-context.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPriorityRank } from "@/features/announcements/constants/announcement-options";
import { AnnouncementValidationService } from "@/features/announcements/services/announcement-validation.service";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { isAnnouncementVisibleToEmployee } from "@/features/announcements/services/announcement-audience.service";
import type {
  AnnouncementFilters,
  AnnouncementAudienceOptions,
  AnnouncementFormValues,
  AnnouncementListItem,
  AnnouncementListResult,
  AnnouncementStatus,
} from "@/features/announcements/types/announcement.types";

function normalizeOptional(value: string) {
  const nextValue = value.trim();

  return nextValue.length > 0 ? nextValue : null;
}

async function requireActiveCompanyId() {
  return requireCurrentCompanyId();
}

async function getCurrentEmployeeForAnnouncements() {
  const context = await requireCurrentEmployeeContext();

  const supabase = createSupabaseAdminClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, company_id, role_id, status")
    .eq("id", context.id)
    .eq("company_id", context.companyId)
    .single();

  if (error || !employee || employee.status !== "active") {
    redirect("/login");
  }

  return employee;
}

function toListItem(row: {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  priority: AnnouncementListItem["priority"];
  publish_from: string | null;
  publish_until: string | null;
  status: AnnouncementStatus;
  created_at: string;
  updated_at: string;
  target_audience?: string | null;
  roleIds?: string[];
  employeeIds?: string[];
}): AnnouncementListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    bannerUrl: row.banner_url ?? "",
    priority: row.priority,
    publishFrom: row.publish_from ?? "",
    publishUntil: row.publish_until ?? "",
    status: row.status,
    targetAudience:
      row.target_audience === "roles" || row.target_audience === "employees"
        ? row.target_audience
        : "company",
    roleIds: row.roleIds ?? [],
    employeeIds: row.employeeIds ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortAnnouncements(
  announcements: AnnouncementListItem[],
): AnnouncementListItem[] {
  return [...announcements].sort((first, second) => {
    const firstPriority = getPriorityRank(first.priority);
    const secondPriority = getPriorityRank(second.priority);

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    return (
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
  });
}

async function loadAudienceByAnnouncementIds(
  companyId: string,
  announcementIds: string[],
) {
  if (announcementIds.length === 0) {
    return new Map<string, { roleIds: string[]; employeeIds: string[] }>();
  }

  const supabase = createSupabaseAdminClient();
  const [rolesResult, employeesResult] = await Promise.all([
    supabase
      .from("announcement_roles")
      .select("announcement_id, role_id")
      .eq("company_id", companyId)
      .in("announcement_id", announcementIds),
    supabase
      .from("announcement_employees")
      .select("announcement_id, employee_id")
      .eq("company_id", companyId)
      .in("announcement_id", announcementIds),
  ]);

  if (rolesResult.error || employeesResult.error) {
    console.error(
      "[AnnouncementService] Unable to load announcement audiences.",
      {
        rolesError: rolesResult.error,
        employeesError: employeesResult.error,
      },
    );
    throw new Error("Unable to load announcement audiences.");
  }

  const audienceById = new Map<
    string,
    { roleIds: string[]; employeeIds: string[] }
  >();

  announcementIds.forEach((id) => {
    audienceById.set(id, { roleIds: [], employeeIds: [] });
  });

  rolesResult.data.forEach(
    (row: { announcement_id: string; role_id: string }) => {
      audienceById.get(row.announcement_id)?.roleIds.push(row.role_id);
    },
  );

  employeesResult.data.forEach(
    (row: { announcement_id: string; employee_id: string }) => {
      audienceById.get(row.announcement_id)?.employeeIds.push(row.employee_id);
    },
  );

  return audienceById;
}

async function replaceAnnouncementAudience(
  companyId: string,
  announcementId: string,
  targetAudience: "company" | "roles" | "employees",
  roleIds: string[],
  employeeIds: string[],
) {
  const supabase = createSupabaseAdminClient();
  const [deleteRoles, deleteEmployees] = await Promise.all([
    supabase
      .from("announcement_roles")
      .delete()
      .eq("company_id", companyId)
      .eq("announcement_id", announcementId),
    supabase
      .from("announcement_employees")
      .delete()
      .eq("company_id", companyId)
      .eq("announcement_id", announcementId),
  ]);

  if (deleteRoles.error || deleteEmployees.error) {
    throw new Error("Unable to replace announcement audience.");
  }

  if (targetAudience === "roles" && roleIds.length > 0) {
    const { error } = await supabase.from("announcement_roles").insert(
      roleIds.map((roleId) => ({
        company_id: companyId,
        announcement_id: announcementId,
        role_id: roleId,
      })),
    );

    if (error) {
      throw new Error("Unable to save announcement roles.");
    }
  }

  if (targetAudience === "employees" && employeeIds.length > 0) {
    const { error } = await supabase.from("announcement_employees").insert(
      employeeIds.map((employeeId) => ({
        company_id: companyId,
        announcement_id: announcementId,
        employee_id: employeeId,
      })),
    );

    if (error) {
      throw new Error("Unable to save announcement employees.");
    }
  }
}

async function getAnnouncementRecipientIds(
  companyId: string,
  targetAudience: "company" | "roles" | "employees",
  roleIds: string[],
  employeeIds: string[],
) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("employees")
    .select("id, role_id")
    .eq("company_id", companyId)
    .eq("status", "active");

  if (targetAudience === "roles") {
    query = query.in("role_id", roleIds);
  }

  if (targetAudience === "employees") {
    query = query.in("id", employeeIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data.map((employee) => employee.id);
}

function isAnnouncementVisibleNow(values: {
  status: AnnouncementStatus;
  publishFrom: string | null;
  publishUntil: string | null;
}) {
  const now = Date.now();
  const publishFrom = values.publishFrom
    ? new Date(values.publishFrom).getTime()
    : null;
  const publishUntil = values.publishUntil
    ? new Date(values.publishUntil).getTime()
    : null;

  return (
    values.status === "active" &&
    (!publishFrom || publishFrom <= now) &&
    (!publishUntil || publishUntil >= now)
  );
}

export const AnnouncementService = {
  async list(filters: AnnouncementFilters): Promise<AnnouncementListResult> {
    const supabase = createSupabaseAdminClient();
    const companyId = await requireActiveCompanyId();
    const search = filters.search?.trim();

    let query = supabase
      .from("announcements")
      .select(
        "id, title, description, banner_url, priority, publish_from, publish_until, status, target_audience, created_at, updated_at",
      )
      .eq("company_id", companyId);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }

    if (filters.target && filters.target !== "all") {
      query = query.eq("target_audience", filters.target);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error(
        "[AnnouncementService] Unable to load announcements.",
        error,
      );
      throw new Error("Unable to load announcements.");
    }

    const audienceById = await loadAudienceByAnnouncementIds(
      companyId,
      data.map((announcement) => announcement.id),
    );

    return {
      announcements: sortAnnouncements(
        data.map((announcement) =>
          toListItem({
            ...announcement,
            ...(audienceById.get(announcement.id) ?? {
              roleIds: [],
              employeeIds: [],
            }),
          }),
        ),
      ),
    };
  },

  async listForEmployee(): Promise<AnnouncementListResult> {
    const supabase = createSupabaseAdminClient();
    const employee = await getCurrentEmployeeForAnnouncements();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "id, title, description, banner_url, priority, publish_from, publish_until, status, target_audience, created_at, updated_at",
      )
      .eq("company_id", employee.company_id)
      .eq("status", "active")
      .or(`publish_from.is.null,publish_from.lte.${now}`)
      .or(`publish_until.is.null,publish_until.gte.${now}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "[AnnouncementService] Unable to load employee announcements.",
        error,
      );
      throw new Error("Unable to load announcements.");
    }

    const audienceById = await loadAudienceByAnnouncementIds(
      employee.company_id,
      data.map((announcement) => announcement.id),
    );

    return {
      announcements: sortAnnouncements(
        data
          .filter((announcement) => {
            const audience = audienceById.get(announcement.id) ?? {
              roleIds: [],
              employeeIds: [],
            };

            return isAnnouncementVisibleToEmployee(
              announcement.target_audience,
              audience,
              employee,
            );
          })
          .map((announcement) =>
            toListItem({
              ...announcement,
              ...(audienceById.get(announcement.id) ?? {
                roleIds: [],
                employeeIds: [],
              }),
            }),
          ),
      ),
    };
  },

  async listForAdminDashboard(): Promise<AnnouncementListResult> {
    const supabase = createSupabaseAdminClient();
    const companyId = await requireActiveCompanyId();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "id, title, description, banner_url, priority, publish_from, publish_until, status, target_audience, created_at, updated_at",
      )
      .eq("company_id", companyId)
      .eq("status", "active")
      .or(`publish_from.is.null,publish_from.lte.${now}`)
      .or(`publish_until.is.null,publish_until.gte.${now}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "[AnnouncementService] Unable to load admin dashboard announcements.",
        error,
      );
      throw new Error("Unable to load announcements.");
    }

    const audienceById = await loadAudienceByAnnouncementIds(
      companyId,
      data.map((announcement) => announcement.id),
    );

    return {
      announcements: sortAnnouncements(
        data.map((announcement) =>
          toListItem({
            ...announcement,
            ...(audienceById.get(announcement.id) ?? {
              roleIds: [],
              employeeIds: [],
            }),
          }),
        ),
      ),
    };
  },

  async getAudienceOptions(): Promise<AnnouncementAudienceOptions> {
    const supabase = createSupabaseAdminClient();
    const companyId = await requireActiveCompanyId();
    const [rolesResult, employeesResult] = await Promise.all([
      supabase
        .from("roles")
        .select("id, name, display_order")
        .eq("company_id", companyId)
        .eq("status", "active")
        .order("display_order", { ascending: true }),
      supabase
        .from("employees")
        .select("id, employee_id, name")
        .eq("company_id", companyId)
        .eq("status", "active")
        .order("name", { ascending: true }),
    ]);

    if (rolesResult.error || employeesResult.error) {
      throw new Error("Unable to load announcement audience options.");
    }

    return {
      roles: rolesResult.data.map((role) => ({
        id: role.id,
        label: role.name,
      })),
      employees: employeesResult.data.map((employee) => ({
        id: employee.id,
        label: employee.name,
        description: employee.employee_id,
      })),
    };
  },

  async create(values: AnnouncementFormValues) {
    const validated = AnnouncementValidationService.validate(values);
    const supabase = createSupabaseAdminClient();
    const companyId = await requireActiveCompanyId();
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        company_id: companyId,
        title: validated.title,
        description: normalizeOptional(validated.description),
        banner_url: normalizeOptional(validated.bannerUrl),
        priority: validated.priority,
        publish_from: validated.publishFrom,
        publish_until: validated.publishUntil,
        status: validated.status,
        target_audience: validated.targetAudience,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error(
        "[AnnouncementService] Unable to create announcement.",
        error,
      );
      throw new Error("Unable to create announcement.");
    }

    await replaceAnnouncementAudience(
      companyId,
      data.id,
      validated.targetAudience,
      validated.roleIds,
      validated.employeeIds,
    );

    if (
      isAnnouncementVisibleNow({
        status: validated.status,
        publishFrom: validated.publishFrom,
        publishUntil: validated.publishUntil,
      })
    ) {
      try {
        const recipientIds = await getAnnouncementRecipientIds(
          companyId,
          validated.targetAudience,
          validated.roleIds,
          validated.employeeIds,
        );

        await NotificationService.createForRecipients(
          {
            companyId,
            type: "announcement",
            priority: validated.notificationPriority,
            title: "New announcement",
            message: validated.title,
            actionUrl: "/announcements",
          },
          recipientIds.map((id) => ({ id })),
        );
      } catch (notificationError) {
        console.error(
          "[AnnouncementService] Unable to create announcement notifications.",
          notificationError,
        );
      }
    }
  },

  async update(id: string, values: AnnouncementFormValues) {
    const validated = AnnouncementValidationService.validate(values);
    const supabase = createSupabaseAdminClient();
    const companyId = await requireActiveCompanyId();
    const { error } = await supabase
      .from("announcements")
      .update({
        title: validated.title,
        description: normalizeOptional(validated.description),
        banner_url: normalizeOptional(validated.bannerUrl),
        priority: validated.priority,
        publish_from: validated.publishFrom,
        publish_until: validated.publishUntil,
        status: validated.status,
        target_audience: validated.targetAudience,
      })
      .eq("company_id", companyId)
      .eq("id", id);

    if (error) {
      throw new Error("Unable to update announcement.");
    }

    await replaceAnnouncementAudience(
      companyId,
      id,
      validated.targetAudience,
      validated.roleIds,
      validated.employeeIds,
    );
  },

  async setStatus(
    id: string,
    status: Extract<AnnouncementStatus, "active" | "archived">,
  ) {
    const supabase = createSupabaseAdminClient();
    const companyId = await requireActiveCompanyId();
    const { error } = await supabase
      .from("announcements")
      .update({ status })
      .eq("company_id", companyId)
      .eq("id", id);

    if (error) {
      throw new Error("Unable to update announcement status.");
    }
  },
};
