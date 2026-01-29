import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid Turbopack selecting the wrong workspace root when multiple lockfiles exist
  turbopack: {
    root: __dirname,
  },

  // Silence Next dev cross-origin warnings when using LAN IP in dev
  allowedDevOrigins: [
    // NOTE: values are origins/hostnames (no scheme/port). Wildcards allowed.
    "localhost",
    "127.0.0.1",
    "192.168.29.46",
  ],
};

export default nextConfig;
