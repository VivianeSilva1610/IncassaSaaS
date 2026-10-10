import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // Fotos de produto, logo e capa de loja são sempre uma URL colada pelo
    // dono (hospedada em outro lugar), nunca upload — sem isso o
    // next/image recusa qualquer host que não esteja explicitamente aqui.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
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
