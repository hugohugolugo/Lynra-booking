import type { NextConfig } from "next";

// TODO: Before production, set ALLOWED_FRAME_ORIGIN in your environment to your
// Webflow domain (e.g. https://yoursite.webflow.io) and update frame-ancestors below.
const frameOrigin = process.env.ALLOWED_FRAME_ORIGIN ?? "*";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' required for Next.js App Router hydration scripts.
  // Tighten with nonces before production: https://nextjs.org/docs/app/guides/content-security-policy
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Images served from Mews CDN; data: and blob: needed for Next.js image optimisation.
  `img-src 'self' https://cdn.mews-demo.com https://cdn.mews.com data: blob:`,
  // next/font/google self-hosts fonts — no external font origin needed.
  "font-src 'self'",
  // All API calls go through same-origin /api/* routes — no external connect needed.
  "connect-src 'self'",
  // Disallow plugins (Flash etc.)
  "object-src 'none'",
  // Prevent base tag hijacking
  "base-uri 'self'",
  // Prevent form action hijacking
  "form-action 'self'",
  // Controls which origins can embed this page as an iframe.
  // Change * to your Webflow domain in production.
  `frame-ancestors ${frameOrigin}`,
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.mews-demo.com" },
      { protocol: "https", hostname: "cdn.mews.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",   value: csp },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Prevent API responses from being cached anywhere
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
