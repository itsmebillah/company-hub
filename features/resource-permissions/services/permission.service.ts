import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import { requireCurrentCompanyId } from "@/features/auth/services/current-company-context.service";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PermissionValidationService } from "@/features/resource-permissions/services/permission-validation.service";
import type { Database } from "@/lib/supabase/types";
import type {
  PermissionEmployee,
  ResourcePermissionDraft,
  ResourcePermissionManagementData,
  ResourcePermissionState,
} from "@/features/resource-permissions/types/resource-permission.types";

type ResourcePermissionInsert =
  Database["public"]["Tables"]["resource_permissions"]["Insert"];

function buildPermissionStates(
  permissions: Array<{
    resource_id: string;
    permission_type: "public" | "role" | "employee";
    role_id: string | null;
    employee_id: string | null;
  }>,
) {
  const states = new Map<string, ResourcePermissionState>();

  permissions.forEach((permission) => {
    const current =
      states.get(permission.resource_id) ??
      ({
        resourceId: permission.resource_id,
        isPublic: false,
        roleIds: [],
        employeeIds: [],
      } satisfies ResourcePermissionState);

    if (permission.permission_type === "public") {
      current.isPublic = true;
      current.roleIds = [];
      current.employeeIds = [];
    }

    if (!current.isPublic && permission.permission_type === "role" && permission.role_id) {
      current.roleIds.push(permission.role_id);
    }

    if (
      !current.isPublic &&
      permission.permission_type === "employee" &&
      permission.employee_id
    ) {
      current.employeeIds.push(permission.employee_id);
    }

    states.set(permission.resource_id, current);
  });

  return Array.from(states.values());
}

export const PermissionService = {
  async getManagementData(): Promise<ResourcePermissionManagementData> {
    const supabase = createSupabaseAdminClient();
    const companyId = await requireCurrentCompanyId();

    const [categoriesResult, resourcesResult, rolesResult, employeesResult, permissionsResult] =
      await Promise.all([
        supabase
          .from("resource_categories")
          .select("id, name, display_order")
          .eq("company_id", companyId)
          .eq("status", "active")
          .order("display_order", { ascending: true }),
        supabase
          .from("resources")
          .select("id, title, category_id, display_order")
          .eq("company_id", companyId)
          .eq("status", "active")
          .order("display_order", { ascending: true }),
        supabase
          .from("roles")
          .select("id, name, display_order")
          .eq("company_id", companyId)
          .eq("status", "active")
          .order("display_order", { ascending: true }),
        supabase
          .from("employees")
          .select("id, employee_id, name, role_id")
          .eq("company_id", companyId)
          .eq("status", "active")
          .order("name", { ascending: true }),
        supabase
          .from("resource_permissions")
          .select("resource_id, permission_type, role_id, employee_id")
          .eq("company_id", companyId)
          .eq("status", "active"),
      ]);

    if (categoriesResult.error) {
      console.error("[PermissionService] Unable to load categories.", categoriesResult.error);
      throw new Error("Unable to load resource categories.");
    }

    if (resourcesResult.error) {
      console.error("[PermissionService] Unable to load resources.", resourcesResult.error);
      throw new Error("Unable to load resources.");
    }

    if (rolesResult.error) {
      console.error("[PermissionService] Unable to load roles.", rolesResult.error);
      throw new Error("Unable to load roles.");
    }

    if (employeesResult.error) {
      console.error("[PermissionService] Unable to load employees.", employeesResult.error);
      throw new Error("Unable to load employees.");
    }

    if (permissionsResult.error) {
      console.error(
        "[PermissionService] Unable to load resource permissions.",
        permissionsResult.error,
      );
      throw new Error("Unable to load resource permissions.");
    }

    const categoryById = new Map(
      categoriesResult.data.map((category) => [category.id, category]),
    );
    const roleById = new Map(rolesResult.data.map((role) => [role.id, role]));

    return {
      resources: resourcesResult.data
        .map((resource) => ({
          id: resource.id,
          title: resource.title,
          categoryId: resource.category_id,
          categoryName: categoryById.get(resource.category_id)?.name ?? "Unknown",
          displayOrder: resource.display_order,
          categoryOrder: categoryById.get(resource.category_id)?.display_order ?? 9999,
        }))
        .sort((first, second) =>
          first.categoryOrder === second.categoryOrder
            ? first.displayOrder - second.displayOrder
            : first.categoryOrder - second.categoryOrder,
        )
        .map(({ categoryOrder: _categoryOrder, ...resource }) => resource),
      roles: rolesResult.data.map((role) => ({
        id: role.id,
        name: role.name,
        displayOrder: role.display_order,
      })),
      employees: employeesResult.data.map(
        (employee): PermissionEmployee => ({
          id: employee.id,
          employeeId: employee.employee_id,
          name: employee.name,
          roleId: employee.role_id,
          roleName: roleById.get(employee.role_id)?.name ?? "Unknown",
        }),
      ),
      permissions: buildPermissionStates(permissionsResult.data),
    };
  },

  async replacePermissions(resourceId: string, draft: ResourcePermissionDraft) {
    PermissionValidationService.validateDraft(draft);

    const supabase = createSupabaseAdminClient();
    const companyId = await requireCurrentCompanyId();
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id, title, status")
      .eq("company_id", companyId)
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      throw new Error("Resource was not found.");
    }

    const rows: ResourcePermissionInsert[] = draft.isPublic
      ? [
          {
            company_id: companyId,
            resource_id: resourceId,
            permission_type: "public" as const,
            role_id: null,
            employee_id: null,
            status: "active" as const,
          },
        ]
      : [
          ...draft.roleIds.map((roleId) => ({
            company_id: companyId,
            resource_id: resourceId,
            permission_type: "role" as const,
            role_id: roleId,
            employee_id: null,
            status: "active" as const,
          })),
          ...draft.employeeIds.map((employeeId) => ({
            company_id: companyId,
            resource_id: resourceId,
            permission_type: "employee" as const,
            role_id: null,
            employee_id: employeeId,
            status: "active" as const,
          })),
        ];

    const { error: deleteError } = await supabase
      .from("resource_permissions")
      .delete()
      .eq("company_id", companyId)
      .eq("resource_id", resourceId);

    if (deleteError) {
      throw new Error("Unable to replace permissions.");
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("resource_permissions")
        .insert(rows);

      if (insertError) {
        throw new Error("Unable to save permissions.");
      }
    }

    await logActivity({
      companyId,
      module: "permissions",
      action: "updated",
      entityType: "resources",
      entityId: resourceId,
      description: `Updated resource permissions for ${resource.title}`,
      metadata: {
        isPublic: draft.isPublic,
        roleCount: draft.roleIds.length,
        employeeCount: draft.employeeIds.length,
      },
    });

    if (resource.status === "active") {
      try {
        const recipientQuery = supabase
          .from("employees")
          .select("id, role_id")
          .eq("company_id", companyId)
          .eq("status", "active");

        const { data: employees, error: employeesError } = await recipientQuery;

        if (employeesError) {
          throw employeesError;
        }

        const recipientIds = draft.isPublic
          ? employees.map((employee) => employee.id)
          : employees
              .filter(
                (employee) =>
                  draft.employeeIds.includes(employee.id) ||
                  draft.roleIds.includes(employee.role_id),
              )
              .map((employee) => employee.id);

        await NotificationService.createForRecipients(
          {
            companyId,
            type: "resource",
            title: "Resource available",
            message: resource.title,
            actionUrl: "/resources",
          },
          recipientIds.map((id) => ({ id })),
        );
      } catch (notificationError) {
        console.error(
          "[PermissionService] Unable to create resource notifications.",
          notificationError,
        );
      }
    }
  },
};
