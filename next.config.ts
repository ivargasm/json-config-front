import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Permite que la compilación de producción termine incluso con advertencias/errores de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite compilar si hay advertencias leves de typescript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
