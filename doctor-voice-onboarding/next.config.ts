import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Acknowledge Turbopack (Next.js 16 default); webpack config used when running with --webpack
  turbopack: {},
  webpack: (config) => {
    // Use project root as webpack context (base directory for resolving modules)
    config.context = path.resolve(process.cwd());
    return config;
  },
};

export default nextConfig;
