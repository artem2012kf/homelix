import type { NextConfig } from "next";

const nextConfig: NextConfig & { allowedDevOrigins?: string[] } = {
  reactStrictMode: true,
  // Нужно для удобной проверки сайта с других устройств в одной Wi-Fi сети во время разработки.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.101.153",
    "192.168.101.153:3000"
  ]
};

export default nextConfig;
