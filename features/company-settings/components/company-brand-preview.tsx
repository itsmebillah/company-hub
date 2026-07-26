import { Building2 } from "lucide-react";
import Image from "next/image";

import type { CompanySettingsValues } from "@/features/company-settings/types/company-settings.types";
import { getRenderableImageSrc } from "@/lib/media";

type CompanyBrandPreviewProps = {
  values: CompanySettingsValues;
};

export function CompanyBrandPreview({ values }: CompanyBrandPreviewProps) {
  const logoSrc = getRenderableImageSrc(values.logo);
  const bannerSrc = getRenderableImageSrc(values.banner);
  const themeLabel =
    values.theme === "auto"
      ? "Auto"
      : values.theme === "dark"
        ? "Dark"
        : "Light";

  return (
    <aside className="space-y-4">
      <section className="bg-card rounded-xl border p-5 shadow-sm">
        <h2 className="text-base font-semibold">Live Preview</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Branding preview for Company Hub surfaces.
        </p>

        <div className="bg-background mt-5 overflow-hidden rounded-xl border">
          {bannerSrc ? (
            <div className="relative h-28 w-full">
              <Image
                src={bannerSrc}
                alt=""
                fill
                sizes="(max-width: 1280px) 100vw, 360px"
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="h-24 w-full"
              style={{
                background: `linear-gradient(135deg, ${values.primaryColor || "#2563EB"} 0%, ${values.secondaryColor || "#16A34A"} 100%)`,
              }}
            />
          )}

          <div className="p-4">
            <div className="flex items-center gap-3">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="size-12 rounded-lg border object-cover"
                />
              ) : (
                <div
                  className="flex size-12 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: values.primaryColor || "#2563EB" }}
                >
                  <Building2 className="size-6" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-semibold break-words">
                  {values.companyName || "Company Name"}
                </p>
                <p className="text-muted-foreground text-sm break-words">
                  {values.shortName || "Company short name"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Primary</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="size-5 rounded-full border"
                    style={{
                      backgroundColor: values.primaryColor || "#2563EB",
                    }}
                  />
                  <span className="text-sm font-medium">
                    {values.primaryColor || "#2563EB"}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Secondary</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="size-5 rounded-full border"
                    style={{
                      backgroundColor: values.secondaryColor || "#16A34A",
                    }}
                  />
                  <span className="text-sm font-medium">
                    {values.secondaryColor || "#16A34A"}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Theme</p>
                <p className="mt-2 text-sm font-medium">{themeLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
