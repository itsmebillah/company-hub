import { replaceResourcePermissionsAction } from "@/features/resource-permissions/actions/permission.actions";
import { ResourcePermissionPage } from "@/features/resource-permissions/components";
import { PermissionService } from "@/features/resource-permissions/services/permission.service";

export const dynamic = "force-dynamic";

export default async function AdminResourcePermissionsPage() {
  const data = await PermissionService.getManagementData();

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Resource Permissions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Control which roles and employees can access each resource.
        </p>
      </div>

      <ResourcePermissionPage
        data={data}
        onSave={replaceResourcePermissionsAction}
      />
    </section>
  );
}
