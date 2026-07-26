"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";

export type CompanyBranding = {
  companyName: string;
  shortName?: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  theme?: "auto" | "light" | "dark";
};

const CompanyBrandingContext = createContext<CompanyBranding | null>(null);

function getContrastColor(hexColor: string) {
  const normalized = hexColor.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return "#ffffff";
  const channels = [0, 2, 4].map((offset) => {
    const channel =
      Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.055;
  return darkContrast > whiteContrast ? "#000000" : "#ffffff";
}

export function CompanyBrandingProvider({
  branding,
  children,
}: {
  branding: CompanyBranding;
  children: ReactNode;
}) {
  const { setTheme } = useTheme();
  const value = useMemo(() => branding, [branding]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", branding.primaryColor);
    root.style.setProperty(
      "--primary-foreground",
      getContrastColor(branding.primaryColor),
    );
    root.style.setProperty("--secondary", branding.secondaryColor);
    root.style.setProperty(
      "--secondary-foreground",
      getContrastColor(branding.secondaryColor),
    );
    root.style.setProperty("--accent", branding.secondaryColor);
    root.style.setProperty("--ring", branding.primaryColor);
    root.style.setProperty("--company-primary", branding.primaryColor);
    root.style.setProperty("--company-secondary", branding.secondaryColor);
    root.dataset.companyBranding = "active";

    const themeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    themeMeta?.setAttribute("content", branding.primaryColor);

    let favicon = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"][data-company-favicon]',
    );
    if (branding.favicon) {
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        favicon.dataset.companyFavicon = "true";
        document.head.appendChild(favicon);
      }
      favicon.href = branding.favicon;
    } else {
      favicon?.remove();
    }

    if (!window.localStorage.getItem("theme") && branding.theme) {
      setTheme(branding.theme === "auto" ? "system" : branding.theme);
    }

    return () => {
      delete root.dataset.companyBranding;
    };
  }, [branding, setTheme]);

  return (
    <CompanyBrandingContext.Provider value={value}>
      {children}
    </CompanyBrandingContext.Provider>
  );
}

export function useCompanyBranding() {
  return useContext(CompanyBrandingContext);
}
