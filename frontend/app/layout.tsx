import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZipDrop — Instant File & Text Sharing",
  description:
    "Share files or text securely with a 4-digit code. No sign-up required. Futuristic file sharing SaaS.",
  keywords: ["file sharing", "text sharing", "4-digit code", "ZipDrop", "secure transfer"],
  openGraph: {
    title: "ZipDrop — Instant File & Text Sharing",
    description: "Share files or text securely with a 4-digit code.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}