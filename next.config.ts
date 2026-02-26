import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // Only enable in production (recommended by @serwist/next)
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // Silence Turbopack warning caused by @serwist/next injecting a webpack config.
  // Serwist's webpack plugin handles service worker bundling; Turbopack works
  // fine without it (SW is disabled in dev anyway via the `disable` option above).
  turbopack: {},

  // Allow Supabase auth images (Google profile pics)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
