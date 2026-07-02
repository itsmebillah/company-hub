import { Building2 } from "lucide-react";

import type { CompanySettingsValues } from "@/features/company-settings/types/company-settings.types";
import { getRenderableImageSrc } from "@/lib/media";

type CompanyBrandPreviewProps = {
  values: CompanySettingsValues;
};

export function CompanyBrandPreview({ values }: CompanyBrandPreviewProps) {
  const logoSrc = getRenderableImageSrc(values.logo);
  const themeLabel =
    values.theme === "auto" ? "Auto" : values.theme === "dark" ? "Dark" : "Light";

  return (
    <aside className="space-y-4">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Live Preview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Branding preview for Company Hub surfaces.
        </p>

        <div className="mt-5 rounded-xl border bg-background p-4">
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
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
              <p className="truncate text-lg font-semibold">
                {values.companyName || "Company Name"}
              </p>
              <p className="text-sm text-muted-foreground">
                {values.shortName || "Company short name"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Primary</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="size-5 rounded-full border"
                  style={{ backgroundColor: values.primaryColor || "#2563EB" }}
                />
                <span className="text-sm font-medium">
                  {values.primaryColor || "#2563EB"}
                </span>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Theme</p>
              <p className="mt-2 text-sm font-medium">{themeLabel}</p>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
