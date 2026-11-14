import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Script from "next/script";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "ZipDrop – Share, Convert & Edit Files Online Free",
    template: "%s | ZipDrop",
  },

  description:
    "Share files, images, videos and text between devices with ZipDrop. Edit supported documents and convert files online without signing up.",

  keywords: [
    "ZipDrop",
    "file sharing",
    "text sharing",
    "file transfer",
    "share files online",
    "4 digit code sharing",
    "online file converter",
    "edit documents online",
    "convert PDF to Word",
    "Ved Mehta",
    "Virti Panchamia",
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

  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    title: "ZipDrop – Share, Convert & Edit Files Online Free",
    description:
      "Share files, images, videos and text between devices with a 4-digit code. Edit supported documents and convert files online — no account needed.",
    url: SITE_URL,
    siteName: "ZipDrop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZipDrop – Share, Convert & Edit Files Online",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZipDrop – Share, Convert & Edit Files Online Free",
    description:
      "Share files, images, videos and text between devices with a 4-digit code. Edit supported documents and convert files online — no account needed.",
    images: ["/og-image.png"],
  },

  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ZipDrop",
    url: SITE_URL,
    applicationCategory: "FileSharingApplication",
    operatingSystem: "Web",
    description:
      "ZipDrop is a free file and text sharing site that uses a 4-digit code. Convert files and edit documents in the browser without signing up.",
    creator: [
      {
        "@type": "Person",
        name: "Ved Mehta",
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: "DJ Sanghvi College of Engineering",
        },
      },
      {
        "@type": "Person",
        name: "Virti Panchamia",
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: "DJ Sanghvi College of Engineering",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        {/* Google Fonts Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ✅ Google Analytics */}
       <Script
  src="https://www.googletagmanager.com/gtag/js?id=G-N4017QP0HN"
  strategy="afterInteractive"
/>
        <Script id="google-analytics" strategy="afterInteractive">
          {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
    gtag('config', 'G-N4017QP0HN', {
  debug_mode: true,
});
    `}
        </Script>

        {/* Structured Data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>

      <body>
        {children}
        <SiteFooter />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}