import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/delivery-admin/:path*",
        destination: "/restaurante/:path*",
        permanent: true,
      },
      {
        source: "/marmitex",
        destination: "/pranzo",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
