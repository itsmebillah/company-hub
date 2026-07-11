import { Building2 } from "lucide-react";

import type { EmployeeResourceProfile } from "@/features/employee-resources/types/employee-resource.types";
import { getRenderableImageSrc } from "@/lib/media";

type EmployeePortalIdentityBarProps = {
  profile: EmployeeResourceProfile;
};

export function EmployeePortalIdentityBar({
  profile,
}: EmployeePortalIdentityBarProps) {
  const companyLogo = getRenderableImageSrc(profile.companyLogo);

  return (
    <section className="flex min-w-0 items-center gap-3">
      {companyLogo ? (
        <img
          src={companyLogo}
          alt=""
          className="size-10 shrink-0 rounded-lg border object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="size-5" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="break-words text-lg font-semibold leading-6 md:text-xl">
          {profile.companyName}
        </h1>
        <p className="break-words text-sm text-muted-foreground">
          Welcome, {profile.employeeName}
        </p>
      </div>
    </section>
  );
}
