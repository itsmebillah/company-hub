import type { ReactNode } from "react";

import { AppLayout } from "@/components/layouts";

export default function AppRouteGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AppLayout>{children}</AppLayout>;
}
