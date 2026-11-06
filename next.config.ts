import type { NextConfig } from "next";

// Build especial para GitHub Pages (export estático).
// O dev server local e o build padrão permanecem inalterados.
const isPagesBuild = process.env.NEXT_PUBLIC_PAGES === "1";

const nextConfig: NextConfig = {
  ...(isPagesBuild
    ? {
        output: "export",
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
        trailingSlash: true,
        // No Next 16, output: "export" escreve o site estático na raiz do distDir.
        // Usamos "out" (padrão do GitHub Pages) sem interferir no .next do dev server.
        distDir: "out",
      }
    : { output: "standalone" }),
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
