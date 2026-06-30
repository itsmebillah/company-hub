import { HierarchyManagement } from "@/features/hierarchy/components";
import {
  bulkReassignAction,
  changeManagerAction,
} from "@/features/hierarchy/actions/hierarchy.actions";
import { getHierarchyEmployees } from "@/features/hierarchy/services/hierarchy.service";

export const dynamic = "force-dynamic";

export default async function HierarchyPage() {
  const employees = await getHierarchyEmployees();

  return (
    <HierarchyManagement
      employees={employees}
      onChangeManager={changeManagerAction}
      onBulkReassign={bulkReassignAction}
    />
  );
}
