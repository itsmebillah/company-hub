import packageMetadata from "@/package.json";

export const appConfig = {
  name: "Company Hub",
  version: packageMetadata.version,
  environment: process.env.NODE_ENV,
} as const;
