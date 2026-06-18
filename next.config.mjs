/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.cuponomia.com.br" },
      { protocol: "https", hostname: "**.cuponomia.com.br" },
    ],
  },
};

export default nextConfig;
