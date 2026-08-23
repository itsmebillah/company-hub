import { handleLocationIngestionRequest } from "@/features/live-location/services/location-ingestion-http.service";
import { CurrentEmployeeContextService } from "@/features/auth/services/current-employee-context.service";
import { LocationIngestionService } from "@/features/live-location/services/location-ingestion.service";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";
import { MobileAuthService } from "@/features/mobile-api/services/mobile-auth.service";
import { mobileErrorResponse } from "@/features/mobile-api/services/mobile-api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (request.headers.has("authorization")) {
    try {
      return await MobileAuthService.runAuthenticated(request, (context) =>
        handleLocationIngestionRequest(request, {
          getEmployee: async () => ({
            employeeId: context.employee.id,
            companyId: context.employee.companyId,
            status: context.employee.status,
          }),
          isFeatureEnabled: FeatureAccessService.isEnabled,
          ingest: LocationIngestionService.ingest,
        }),
      );
    } catch (error) {
      return mobileErrorResponse(error);
    }
  }
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
