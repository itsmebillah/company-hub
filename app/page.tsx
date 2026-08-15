import type { Metadata } from "next";

import { PublicHomePage } from "@/features/public-site/components/public-home-page";

export const metadata: Metadata = {
  title: "Secure employee operations",
  description:
    "Company Hub is a secure workspace for employee operations, attendance, reporting, and protected attendance media.",
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <PublicHomePage />;
}
