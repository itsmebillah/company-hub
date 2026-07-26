import type { MetadataRoute } from "next";
import { getCompanySettings } from "@/features/company-settings/services/company-settings.service";
import { getPublicStorageUrl } from "@/lib/media";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const branding = await getCompanySettings().catch(() => null);
  const icon = branding?.favicon
    ? getPublicStorageUrl("company-assets", branding.favicon) ||
      branding.favicon
    : "/icon.svg";
  return {
    name: branding?.companyName || "Company Hub",
    short_name: branding?.shortName || branding?.companyName || "Company Hub",
    description: "Company Hub project foundation.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: branding?.secondaryColor || "#fafafa",
    theme_color: branding?.primaryColor || "#2563EB",
    icons: [
      {
        src: icon,
        sizes: "any",
        type: icon.endsWith(".svg") ? "image/svg+xml" : "image/png",
        purpose: "any",
      },
      {
        src: icon,
        sizes: "any",
        type: icon.endsWith(".svg") ? "image/svg+xml" : "image/png",
        purpose: "maskable",
      },
    ],
  };
}
