import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin";

export default function AdminRouteGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
