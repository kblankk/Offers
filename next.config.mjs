/** @type {import('next').NextConfig} */
const nextConfig = {
  // Playwright usa binarios externos e nao deve ser empacotado pelo webpack.
  serverExternalPackages: ["playwright", "playwright-core"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.cuponomia.com.br" },
      { protocol: "https", hostname: "**.cuponomia.com.br" },
    ],
  },
};

export default nextConfig;
