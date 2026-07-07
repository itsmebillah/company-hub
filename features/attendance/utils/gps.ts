import type {
  AttendanceGpsInput,
  CompanyLocation,
} from "@/features/attendance/types/attendance.types";

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateHaversineDistanceMeters(
  first: Pick<AttendanceGpsInput, "latitude" | "longitude">,
  second: Pick<CompanyLocation, "latitude" | "longitude">,
) {
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);

  const halfChordLength =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const angularDistance =
    2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));

  return EARTH_RADIUS_METERS * angularDistance;
}

export function findNearestCompanyLocation(
  gps: AttendanceGpsInput,
  locations: CompanyLocation[],
) {
  return locations
    .map((location) => ({
      location,
      distanceMeters: calculateHaversineDistanceMeters(gps, location),
    }))
    .sort((first, second) => first.distanceMeters - second.distanceMeters)[0];
}
