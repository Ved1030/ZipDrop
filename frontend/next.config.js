/** @type {import('next').NextConfig} */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;