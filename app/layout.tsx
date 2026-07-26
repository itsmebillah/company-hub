import type { Metadata, Viewport } from "next";
import { cache } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { getCompanySettings } from "@/features/company-settings/services/company-settings.service";
import { getPublicStorageUrl } from "@/lib/media";
import { ReleaseUpdateProvider } from "@/features/releases/components/release-update-provider";
import { ReleaseService } from "@/features/releases/services/release.service";
import { appConfig } from "@/lib/config/app";

import "./globals.css";

const getCurrentBranding = cache(async () => {
  try {
    return await getCompanySettings();
  } catch {
    return null;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getCurrentBranding();
  const applicationName = branding?.companyName || "Company Hub";
  const favicon = branding?.favicon
    ? getPublicStorageUrl("company-assets", branding.favicon) ||
      branding.favicon
    : "/icon.svg";

  return {
    title: {
      default: applicationName,
      template: `%s | ${applicationName}`,
    },
    description: "Secure employee and company operations workspace.",
    applicationName,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: favicon,
      apple: "/apple-icon.svg",
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const branding = await getCurrentBranding();
  return {
    themeColor: branding?.primaryColor || "#2563EB",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const latestRelease = await ReleaseService.getLatestPublished().catch(
    () => null,
  );
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background min-h-svh font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReleaseUpdateProvider
            currentVersion={appConfig.version}
            latestRelease={latestRelease}
          >
            {children}
          </ReleaseUpdateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
