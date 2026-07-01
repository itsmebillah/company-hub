import "server-only";

import {
  SYSTEM_ROLE_ORDER,
  isSystemRoleName,
} from "@/features/employees/constants/employee-rules";
import type {
  RoleFormValues,
  RoleListItem,
  RoleStatus,
} from "@/features/roles/types/role.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOW_SYSTEM_ROLE_RENAME = false;

function logRoleServiceError(context: string, error: unknown) {
  console.error(`[RoleService] ${context}`, error);
}

function assertStatus(status: string): asserts status is RoleStatus {
  if (!["active", "inactive", "archived"].includes(status)) {
    throw new Error("Role status is invalid.");
  }
}

function validate(values: RoleFormValues) {
  if (!values.name.trim()) {
    throw new Error("Role name is required.");
  }

  assertStatus(values.status);

  const displayOrder = Number(values.displayOrder);

  if (!Number.isInteger(displayOrder) || displayOrder <= 0) {
    throw new Error("Display order must be a positive number.");
  }

  return {
    name: values.name.trim(),
    displayOrder,
    status: values.status,
  };
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
    logRoleServiceError("Unable to load active company.", error);
    throw new Error("Unable to load company information.");
  }

  return data[0]?.id ?? null;
}

async function requireActiveCompanyId() {
  const companyId = await getActiveCompanyId();

  if (!companyId) {
    throw new Error("Company was not found.");
  }

  return companyId;
}

function nextAvailableOrder(usedOrders: Set<number>, preferredOrder: number) {
  if (!usedOrders.has(preferredOrder)) {
    usedOrders.add(preferredOrder);
    return preferredOrder;
  }

  let nextOrder = Math.max(...Array.from(usedOrders), 0) + 1;

  while (usedOrders.has(nextOrder)) {
    nextOrder += 1;
  }

  usedOrders.add(nextOrder);
  return nextOrder;
}

async function ensureSystemRoles(companyId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: existingRoles, error } = await supabase
    .from("roles")
    .select("name, display_order")
    .eq("company_id", companyId);

  if (error) {
    logRoleServiceError("Unable to inspect system roles.", error);
    throw new Error("Unable to load roles.");
  }

  const existingNames = new Set(existingRoles.map((role) => role.name));
  const usedOrders = new Set(existingRoles.map((role) => role.display_order));
  const missingRoles = SYSTEM_ROLE_ORDER.filter(
    (roleName) => !existingNames.has(roleName),
  ).map((roleName, index) => ({
    company_id: companyId,
    name: roleName,
    display_order: nextAvailableOrder(usedOrders, index + 1),
    status: "active" as const,
  }));

  if (missingRoles.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("roles").insert(missingRoles);

  if (insertError) {
    logRoleServiceError("Unable to create missing system roles.", insertError);
    throw new Error("Unable to prepare system roles.");
  }
}

async function assertRoleUnique(
  companyId: string,
  name: string,
  displayOrder: number,
  currentId?: string,
) {
  const supabase = createSupabaseAdminClient();
  let nameQuery = supabase
    .from("roles")
    .select("id")
    .eq("company_id", companyId)
    .eq("name", name)
    .limit(1);
  let orderQuery = supabase
    .from("roles")
    .select("id")
    .eq("company_id", companyId)
    .eq("display_order", displayOrder)
    .limit(1);

  if (currentId) {
    nameQuery = nameQuery.neq("id", currentId);
    orderQuery = orderQuery.neq("id", currentId);
  }

  const [nameResult, orderResult] = await Promise.all([nameQuery, orderQuery]);

  if (nameResult.error || orderResult.error) {
    logRoleServiceError("Unable to validate role uniqueness.", {
      nameError: nameResult.error,
      orderError: orderResult.error,
    });
    throw new Error("Unable to validate role.");
  }

  if (nameResult.data.length > 0) {
    throw new Error("Role name already exists.");
  }

  if (orderResult.data.length > 0) {
    throw new Error("Display order already exists.");
  }
}

export const RoleService = {
  async list(): Promise<RoleListItem[]> {
    const companyId = await getActiveCompanyId();

    if (!companyId) {
      return [];
    }

    await ensureSystemRoles(companyId);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, display_order, status")
      .eq("company_id", companyId)
      .order("display_order", { ascending: true });

    if (error) {
      logRoleServiceError("Unable to load roles.", error);
      throw new Error("Unable to load roles.");
    }

    return data.map((role) => ({
      id: role.id,
      name: role.name,
      displayOrder: role.display_order,
      status: role.status,
      isSystemRole: isSystemRoleName(role.name),
      canRename: !isSystemRoleName(role.name) || ALLOW_SYSTEM_ROLE_RENAME,
    }));
  },

  async create(values: RoleFormValues) {
    const validated = validate(values);
    const supabase = createSupabaseAdminClient();
    const companyId = await requireActiveCompanyId();

    await assertRoleUnique(companyId, validated.name, validated.displayOrder);

    const { error } = await supabase.from("roles").insert({
      company_id: companyId,
      name: validated.name,
      display_order: validated.displayOrder,
      status: validated.status,
    });

    if (error) {
      logRoleServiceError("Unable to create role.", error);
      throw new Error("Unable to create role.");
    }
  },

  async update(id: string, values: RoleFormValues) {
    const validated = validate(values);
    const supabase = createSupabaseAdminClient();
    const companyId = await requireActiveCompanyId();
    const { data: existingRole, error: existingRoleError } = await supabase
      .from("roles")
      .select("name")
      .eq("company_id", companyId)
      .eq("id", id)
      .single();

    if (existingRoleError || !existingRole) {
      throw new Error("Role was not found.");
    }

    if (
      isSystemRoleName(existingRole.name) &&
      existingRole.name !== validated.name &&
      !ALLOW_SYSTEM_ROLE_RENAME
    ) {
      throw new Error("System roles cannot be renamed.");
    }

    await assertRoleUnique(companyId, validated.name, validated.displayOrder, id);

    const { error } = await supabase
      .from("roles")
      .update({
        name: validated.name,
        display_order: validated.displayOrder,
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", companyId)
      .eq("id", id);

    if (error) {
      logRoleServiceError("Unable to update role.", error);
      throw new Error("Unable to update role.");
    }
  },

  async setStatus(id: string, status: Extract<RoleStatus, "active" | "inactive">) {
    const supabase = createSupabaseAdminClient();
    const companyId = await requireActiveCompanyId();
    const { error } = await supabase
      .from("roles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("company_id", companyId)
      .eq("id", id);

    if (error) {
      logRoleServiceError("Unable to update role status.", error);
      throw new Error("Unable to update role status.");
    }
  },
};
