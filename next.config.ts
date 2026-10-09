import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Security-Advice",
            value: "Don't hack what you can't break",
          },
          {
            key: "X-Hacker-Message",
            value: "Nice try. Report real 0days to @lonestill",
          },
          {
            key: "X-Powered-By",
            value: "Pentest-Protection-v2",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
