import { AdminLiveLocationPage } from "@/features/live-location/components/admin-live-location-page";
import { AdminLiveLocationService } from "@/features/live-location/services/admin-live-location.service";

export const dynamic = "force-dynamic";

export default async function AdminLiveLocationRoutePage() {
  const locations = await AdminLiveLocationService.getLocations();
  return <AdminLiveLocationPage locations={locations} />;
}
