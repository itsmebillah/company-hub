import type { ReactNode } from "react";

import { AuthLayout } from "@/components/layouts";

export default function AuthRouteGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AuthLayout>{children}</AuthLayout>;
}
