import "server-only";

type ReverseGeocodeResult = {
  address: string | null;
};

function normalizeAddress(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const address = value as Record<string, string | undefined>;
  const parts = [
    address.house_number && address.road
      ? `${address.house_number}, ${address.road}`
      : address.road,
    address.suburb,
    address.city_district,
    address.city,
    address.state_district,
    address.state,
    address.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

export const AttendanceReverseGeocodeService = {
  async reverseLookup(input: {
    latitude: number;
    longitude: number;
  }): Promise<ReverseGeocodeResult> {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("lat", String(input.latitude));
      url.searchParams.set("lon", String(input.longitude));
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "company-hub-attendance/1.0",
        },
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        return { address: null };
      }

      const payload = (await response.json()) as {
        display_name?: string;
        address?: Record<string, string | undefined>;
      };

      return {
        address: normalizeAddress(payload.address) ?? payload.display_name ?? null,
      };
    } catch (error) {
      console.error(
        "[AttendanceReverseGeocodeService] Reverse geocoding failed.",
        error,
      );

      return { address: null };
    }
  },
};
