import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@acra/database",
    "@acra/review-schema",
    "@acra/shared",
  ],
};

export default nextConfig;