/** @type {import('next').NextConfig} */
const nextConfig = {
  // Playwright e modulos nativos do worker nao devem ser empacotados pelo Next.
  serverExternalPackages: ["playwright"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.cuponomia.com.br" },
      { protocol: "https", hostname: "**.cuponomia.com.br" },
    ],
  },
};

export default nextConfig;
