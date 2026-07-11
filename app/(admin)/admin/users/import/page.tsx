import {
  getEmployeeImportFailedRowsAction,
  previewEmployeeImportAction,
  processEmployeeImportBatchAction,
} from "@/features/employee-import/actions/employee-import.actions";
import { EmployeeImportFoundationPage } from "@/features/employee-import/components";
import { EmployeeImportService } from "@/features/employee-import/services/employee-import.service";

export const dynamic = "force-dynamic";

export default async function AdminEmployeeImportPage() {
  const data = await EmployeeImportService.getFoundationData();

  return (
    <EmployeeImportFoundationPage
      data={data}
      onPreviewImport={previewEmployeeImportAction}
      onProcessBatch={processEmployeeImportBatchAction}
      onGetFailedRows={getEmployeeImportFailedRowsAction}
    />
  );
}
