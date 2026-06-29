/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow fetching from Supabase in server components / API routes
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
