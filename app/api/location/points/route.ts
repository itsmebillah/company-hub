import { handleLocationIngestionRequest } from "@/features/live-location/services/location-ingestion-http.service";
import { CurrentEmployeeContextService } from "@/features/auth/services/current-employee-context.service";
import { LocationIngestionService } from "@/features/live-location/services/location-ingestion.service";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

export async function POST(request: Request) {
  return handleLocationIngestionRequest(request, {
    async getEmployee() {
      const employee =
        await CurrentEmployeeContextService.getCurrentEmployeeContext();
      return employee
        ? {
            employeeId: employee.id,
            companyId: employee.companyId,
            status: employee.status,
          }
        : null;
    },
    isFeatureEnabled: FeatureAccessService.isEnabled,
    ingest: LocationIngestionService.ingest,
  });
}
