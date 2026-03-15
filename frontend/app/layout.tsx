import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://zip-drop.vercel.app"),

  title: {
    default: "ZipDrop – Instant File & Text Sharing",
    template: "%s | ZipDrop",
  },

  description:
    "ZipDrop lets you instantly share files and text using a secure 4-digit code. No sign-up required. Fast, simple and secure file sharing across devices.",

  keywords: [
    "ZipDrop",
    "file sharing",
    "text sharing",
    "instant file transfer",
    "secure file sharing",
    "4 digit code sharing",
    "share files online",
    "upload and share files",
    "send files instantly",
  ],

  authors: [{ name: "ZipDrop" }],
  creator: "ZipDrop",
  publisher: "ZipDrop",

  robots: {
    index: true,
    follow: true,
    nocache: false,
  },

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "ZipDrop – Instant File & Text Sharing",
    description:
      "Share files or text instantly with a secure 4-digit code. No accounts required.",
    url: "https://zip-drop.vercel.app",
    siteName: "ZipDrop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZipDrop File Sharing",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZipDrop – Instant File & Text Sharing",
    description:
      "Upload files, get a code, and share instantly across devices.",
    images: ["/og-image.png"],
  },

  category: "technology",
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