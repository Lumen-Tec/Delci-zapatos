import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      }
    ]
  },
  // Configuración de turbopack para evitar el warning de múltiples lockfiles
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
