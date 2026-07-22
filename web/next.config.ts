import type { NextConfig } from "next";

function trimUrl(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/$/, "");
}

const apiUpstream = trimUrl(
  process.env.API_UPSTREAM ||
    "http://n106xgrqkd5sxussrt8lq40k.46.224.155.225.sslip.io",
);

const publicApiUrl = trimUrl(process.env.NEXT_PUBLIC_API_URL || "/guava-api");

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co";

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
  ? new URL(process.env.NEXT_PUBLIC_POSTHOG_HOST).host
  : "eu.i.posthog.com";

/** Hosts the browser may call (CSP connect-src). */
function apiConnectOrigins(): string[] {
  const origins = new Set<string>();

  if (publicApiUrl.startsWith("http://") || publicApiUrl.startsWith("https://")) {
    try {
      origins.add(new URL(publicApiUrl).origin);
    } catch {
      // ignore invalid URL at build time
    }
  }

  if (apiUpstream.startsWith("http://") || apiUpstream.startsWith("https://")) {
    try {
      origins.add(new URL(apiUpstream).origin);
    } catch {
      // ignore
    }
  }

  return [...origins];
}

const apiConnect = apiConnectOrigins().join(" ");

if (process.env.VERCEL === "1" && apiUpstream.startsWith("http://")) {
  console.warn(
    "[next.config] API_UPSTREAM uses http://. Vercel serves HTTPS — enable TLS on Coolify and set API_UPSTREAM to https://…",
  );
}

/** Baseline CSP — tighten further once production domains are fixed. */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://${posthogHost}`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://${posthogHost}${apiConnect ? ` ${apiConnect}` : ""}`.trim(),
  `img-src 'self' data: blob: https://${supabaseHost}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Allow LAN / phone testing against the Next dev server
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.0.61",
    "*.local",
  ],
  async rewrites() {
    // Same-origin proxy — recommended on Vercel (set API_UPSTREAM to https Coolify host).
    if (!apiUpstream) {
      return [];
    }
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
