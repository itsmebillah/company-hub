import {
  archiveResourceCategoryAction,
  createResourceCategoryAction,
  restoreResourceCategoryAction,
  updateResourceCategoryAction,
} from "@/features/resource-categories/actions/resource-category.actions";
import { ResourceCategoryManagementPage } from "@/features/resource-categories/components";
import { ResourceCategoryService } from "@/features/resource-categories/services/resource-category.service";

export const dynamic = "force-dynamic";

export default async function AdminResourceCategoriesPage() {
  const categories = await ResourceCategoryService.list();

  return (
    <ResourceCategoryManagementPage
      categories={categories}
      onCreate={createResourceCategoryAction}
      onUpdate={updateResourceCategoryAction}
      onArchive={archiveResourceCategoryAction}
      onRestore={restoreResourceCategoryAction}
    />
  );
}
