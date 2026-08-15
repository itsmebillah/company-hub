import type { Metadata } from "next";

import { PrivacyPolicyPage } from "@/features/public-site/components/privacy-policy-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Company Hub handles personal information and Google user data.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}
