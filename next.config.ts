import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Selfies are validated at 5 MB. Allow multipart overhead so Server Actions
    // do not reject valid phone photos before application validation runs.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
