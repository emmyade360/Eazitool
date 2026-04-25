import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  serverExternalPackages: [
    "sharp",
    "pdf-parse",
    "pdfkit",
    "mammoth",
    "docx",
    "canvas",
    "pdfjs-dist",
    "pdf-to-img",
    "pdf2json",
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },

  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "groq-sdk"],
  },

  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
    {
      source: "/api/(.*)",
      headers: [
        { key: "Cache-Control", value: "no-store" },
      ],
    },
    // Only apply immutable caching in production — dev bundles reuse the same
    // filename (module-ID hash, not content hash), so immutable caching in dev
    // causes the browser to serve stale JS after source changes.
    ...(process.env.NODE_ENV === "production"
      ? [
          {
            source: "/_next/static/(.*)",
            headers: [
              { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
            ],
          },
        ]
      : []),
  ],
};

export default nextConfig;
