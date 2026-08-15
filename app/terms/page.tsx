import type { Metadata } from "next";

import { TermsOfServicePage } from "@/features/public-site/components/terms-of-service-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing authorized use of Company Hub.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <TermsOfServicePage />;
}
