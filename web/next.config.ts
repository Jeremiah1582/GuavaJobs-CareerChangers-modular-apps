import type { NextConfig } from "next";

const apiUpstream = (
  process.env.API_UPSTREAM ||
  "http://n106xgrqkd5sxussrt8lq40k.46.224.155.225.sslip.io"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Allow LAN / phone testing against the Next dev server
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.0.61",
    "*.local",
  ],
  async rewrites() {
    return [
      {
        source: "/guava-api/:path*",
        destination: `${apiUpstream}/api/v1/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/login", destination: "/sign-in", permanent: false },
      { source: "/signin", destination: "/sign-in", permanent: false },
      { source: "/singin", destination: "/sign-in", permanent: false },
      { source: "/signup", destination: "/sign-up", permanent: false },
      { source: "/register", destination: "/sign-up", permanent: false },
    ];
  },
};

export default nextConfig;
