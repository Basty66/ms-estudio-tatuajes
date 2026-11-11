import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin esto, Turbopack sube buscando un lockfile y puede tomar la carpeta
  // personal entera como raíz del proyecto.
  turbopack: {
    root: path.resolve(process.cwd()),
  },

  env: {
    // Con qué versión se construyó esta copia del panel: si la del servidor
    // cambia, el panel abierto avisa que hay una nueva (ver AvisoVersion).
    NEXT_PUBLIC_VERSION: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.VERCEL_DEPLOYMENT_ID ?? `local-${Date.now()}`,
  },

  images: {
    // Las fotos de la galería que se suben desde el panel.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },

  async headers() {
    return [
      {
        source: "/tinta/sw.js",
        headers: [
          // Servido desde /tinta/sw.js solo podría controlar /tinta/ —con
          // barra—, y el panel vive en /tinta. Sin esto no hay avisos.
          { key: "Service-Worker-Allowed", value: "/tinta" },
          // Que el navegador pregunte siempre si hay versión nueva.
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
      {
        // El panel no se indexa ni se guarda en cachés intermedias.
        source: "/tinta/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
