import "server-only";

import { redirect } from "next/navigation";

import { requireCurrentEmployeeContext } from "@/features/auth/services/current-employee-context.service";
import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  EmployeePortalCategory,
  EmployeePortalResource,
  EmployeeResourcePortalData,
} from "@/features/employee-resources/types/employee-resource.types";

type ResourceRow = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  resource_type: EmployeePortalResource["resourceType"];
  url: string | null;
  icon: string | null;
  thumbnail: string | null;
  open_mode: EmployeePortalResource["openMode"];
  display_order: number;
  is_featured: boolean;
};

function isAllowedResource(
  resourceId: string,
  permissions: Array<{
    resource_id: string;
    permission_type: "public" | "role" | "employee";
    role_id: string | null;
    employee_id: string | null;
  }>,
  employee: { id: string; role_id: string },
) {
  return permissions.some((permission) => {
    if (permission.resource_id !== resourceId) {
      return false;
    }

    if (permission.permission_type === "public") {
      return true;
    }

    if (permission.permission_type === "role") {
      return permission.role_id === employee.role_id;
    }

    return permission.employee_id === employee.id;
  });
}

export const EmployeeResourceService = {
  async getPortalData(): Promise<EmployeeResourcePortalData> {
    const user = await getCurrentAuthUser();

    if (!user) {
      redirect("/login");
    }

    const supabase = createSupabaseAdminClient();
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, employee_id, name, photo_url, company_id, role_id, status")
      .eq("auth_user_id", user.id)
      .single();

    if (employeeError || !employee || employee.status !== "active") {
      redirect("/login");
    }

    const [{ data: role }, { data: settings }, categoriesResult] =
      await Promise.all([
        supabase
          .from("roles")
          .select("name")
          .eq("company_id", employee.company_id)
          .eq("id", employee.role_id)
          .eq("status", "active")
          .maybeSingle(),
        supabase
          .from("company_settings")
          .select("company_name, company_logo")
          .eq("company_id", employee.company_id)
          .maybeSingle(),
        supabase
          .from("resource_categories")
          .select("id, name, icon, color, display_order")
          .eq("company_id", employee.company_id)
          .eq("status", "active")
          .order("display_order", { ascending: true }),
      ]);

    if (categoriesResult.error) {
      throw new Error("Unable to load resource categories.");
    }

    const categoryIds = categoriesResult.data.map((category) => category.id);

    if (categoryIds.length === 0) {
      return {
        profile: {
          employeeId: employee.employee_id,
          employeeName: employee.name,
          roleName: role?.name ?? "Employee",
          companyName: settings?.company_name ?? "Company Hub",
          companyLogo: settings?.company_logo ?? null,
          photoUrl: employee.photo_url ?? null,
        },
        categories: [],
      };
    }

    const { data: resources, error: resourcesError } = await supabase
      .from("resources")
      .select(
        "id, category_id, title, description, resource_type, url, icon, thumbnail, open_mode, display_order, is_featured",
      )
      .eq("company_id", employee.company_id)
      .eq("status", "active")
      .in("category_id", categoryIds)
      .order("display_order", { ascending: true });

    if (resourcesError) {
      console.error(
        "[EmployeeResourceService] Unable to load resources.",
        resourcesError,
      );
      throw new Error("Unable to load resources.");
    }

    const resourceIds = resources.map((resource) => resource.id);

    if (resourceIds.length === 0) {
      return {
        profile: {
          employeeId: employee.employee_id,
          employeeName: employee.name,
          roleName: role?.name ?? "Employee",
          companyName: settings?.company_name ?? "Company Hub",
          companyLogo: settings?.company_logo ?? null,
          photoUrl: employee.photo_url ?? null,
        },
        categories: [],
      };
    }

    const permissionsResult = await supabase
      .from("resource_permissions")
      .select("resource_id, permission_type, role_id, employee_id")
      .eq("company_id", employee.company_id)
      .eq("status", "active")
      .in("resource_id", resourceIds);

    if (permissionsResult.error) {
      console.error(
        "[EmployeeResourceService] Unable to load resource permissions.",
        permissionsResult.error,
      );
      throw new Error("Unable to load resource permissions.");
    }

    const resourcesByCategory = new Map<string, ResourceRow[]>();

    resources
      .filter((resource) =>
        isAllowedResource(resource.id, permissionsResult.data, employee),
      )
      .forEach((resource) => {
        const current = resourcesByCategory.get(resource.category_id) ?? [];
        current.push(resource);
        resourcesByCategory.set(resource.category_id, current);
      });

    return {
      profile: {
        employeeId: employee.employee_id,
        employeeName: employee.name,
        roleName: role?.name ?? "Employee",
        companyName: settings?.company_name ?? "Company Hub",
        companyLogo: settings?.company_logo ?? null,
        photoUrl: employee.photo_url ?? null,
      },
      categories: categoriesResult.data
        .map((category): EmployeePortalCategory => ({
          id: category.id,
          name: category.name,
          icon: category.icon ?? "",
          color: category.color ?? "#2563EB",
          resources: (resourcesByCategory.get(category.id) ?? []).map(
            (resource): EmployeePortalResource => ({
              id: resource.id,
              title: resource.title,
              description: resource.description ?? "",
              resourceType: resource.resource_type,
              url: resource.url ?? "",
              icon: resource.icon ?? "",
              thumbnail: resource.thumbnail ?? "",
              openMode: resource.open_mode,
              isFeatured: resource.is_featured,
            }),
          ),
        }))
        .filter((category) => category.resources.length > 0),
    };
  },

  async getAdminQuickResourceCategories(): Promise<EmployeePortalCategory[]> {
    const employee = await requireCurrentEmployeeContext();
    const supabase = createSupabaseAdminClient();
    const [categoriesResult, resourcesResult] = await Promise.all([
      supabase
        .from("resource_categories")
        .select("id, name, icon, color, display_order")
        .eq("company_id", employee.companyId)
        .eq("status", "active")
        .order("display_order", { ascending: true }),
      supabase
        .from("resources")
        .select(
          "id, category_id, title, description, resource_type, url, icon, thumbnail, open_mode, display_order, is_featured",
        )
        .eq("company_id", employee.companyId)
        .eq("status", "active")
        .order("display_order", { ascending: true }),
    ]);

    if (categoriesResult.error || resourcesResult.error) {
      console.error("[EmployeeResourceService] Unable to load admin resources.", {
        categoriesError: categoriesResult.error,
        resourcesError: resourcesResult.error,
      });
      throw new Error("Unable to load resources.");
    }

    const resourcesByCategory = new Map<string, ResourceRow[]>();

    resourcesResult.data.forEach((resource) => {
      const current = resourcesByCategory.get(resource.category_id) ?? [];
      current.push(resource);
      resourcesByCategory.set(resource.category_id, current);
    });

    return categoriesResult.data
      .map((category): EmployeePortalCategory => ({
        id: category.id,
        name: category.name,
        icon: category.icon ?? "",
        color: category.color ?? "#2563EB",
        resources: (resourcesByCategory.get(category.id) ?? []).map(
          (resource): EmployeePortalResource => ({
            id: resource.id,
            title: resource.title,
            description: resource.description ?? "",
            resourceType: resource.resource_type,
            url: resource.url ?? "",
            icon: resource.icon ?? "",
            thumbnail: resource.thumbnail ?? "",
            openMode: resource.open_mode,
            isFeatured: resource.is_featured,
          }),
        ),
      }))
      .filter((category) => category.resources.length > 0);
  },
};
