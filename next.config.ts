import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    '192.168.0.102',
    'localhost',
    '127.0.0.1',
    '*.my.id',
    'kondangsensei.my.id'
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
