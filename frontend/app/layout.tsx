import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://zip-drop.vercel.app"),

  title: {
    default: "ZipDrop – Instant File & Text Sharing",
    template: "%s | ZipDrop",
  },

  description:
    "ZipDrop is a fast and secure file and text sharing platform that lets you instantly share files or text using a 4-digit code. Built by Ved Mehta and Virti Panchamia, second-year engineering students at DJ Sanghvi College of Engineering.",

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
    "Ved Mehta",
    "Virti Panchamia",
    "DJ Sanghvi College of Engineering",
  ],

  authors: [
    { name: "Ved Mehta" },
    { name: "Virti Panchamia" },
  ],

  creator: "Ved Mehta, Virti Panchamia",
  publisher: "ZipDrop",

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "ZipDrop – Instant File & Text Sharing",
    description:
      "Share files or text instantly with a secure 4-digit code. Built by Ved Mehta and Virti Panchamia from DJ Sanghvi College of Engineering.",
    url: "https://zip-drop.vercel.app",
    siteName: "ZipDrop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZipDrop File and Text Sharing",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZipDrop – Instant File & Text Sharing",
    description:
      "Share files and text instantly using a secure 4-digit code. Built by Ved Mehta and Virti Panchamia.",
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