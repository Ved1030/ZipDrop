/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Webpack from bundling these — run as native Node.js on server
  serverExternalPackages: ["mammoth", "html-docx-js", "jszip"],

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
