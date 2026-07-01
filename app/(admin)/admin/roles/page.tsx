import {
  activateRoleAction,
  createRoleAction,
  deactivateRoleAction,
  updateRoleAction,
} from "@/features/roles/actions/role.actions";
import { RoleManagementPage } from "@/features/roles/components";
import { RoleService } from "@/features/roles/services/role.service";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  const roles = await RoleService.list();

  return (
    <RoleManagementPage
      roles={roles}
      onCreate={createRoleAction}
      onUpdate={updateRoleAction}
      onActivate={activateRoleAction}
      onDeactivate={deactivateRoleAction}
    />
  );
}
