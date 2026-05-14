import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
