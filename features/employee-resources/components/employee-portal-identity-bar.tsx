import { Building2 } from "lucide-react";
import Image from "next/image";

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
        <Image
          src={companyLogo}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="size-10 shrink-0 rounded-lg border object-cover"
        />
      ) : (
        <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Building2 className="size-5" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-lg leading-6 font-semibold break-words md:text-xl">
          {profile.companyName}
        </h1>
        <p className="text-muted-foreground text-sm break-words">
          Welcome, {profile.employeeName}
        </p>
      </div>
    </section>
  );
}
