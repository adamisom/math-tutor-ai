import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
