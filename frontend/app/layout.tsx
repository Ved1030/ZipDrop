import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Script from "next/script";
export const metadata: Metadata = {
  metadataBase: new URL("https://zip-drop.vercel.app"),

  title: {
    default: "ZipDrop – File & Text Sharing",
    template: "%s | ZipDrop",
  },

  description:
    "ZipDrop is a free file and text sharing site. Upload up to 10 files of up to 1 GB each and share them with a 4-digit code — no account needed. Built by Ved Mehta and Virti Panchamia, engineering students at DJ Sanghvi College of Engineering.",

  keywords: [
    "ZipDrop",
    "file sharing",
    "text sharing",
    "file transfer",
    "share files online",
    "4 digit code sharing",
    "upload and share files",
    "send files by code",
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
    title: "ZipDrop – File & Text Sharing",
    description:
      "Share files and text with a 4-digit code. Up to 10 files, 1 GB per file, no account needed. Built by Ved Mehta and Virti Panchamia from DJ Sanghvi College of Engineering.",
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
    title: "ZipDrop – File & Text Sharing",
    description:
      "Share files and text with a 4-digit code, up to 1 GB per file. Built by Ved Mehta and Virti Panchamia.",
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
    url: "https://zip-drop.vercel.app",
    applicationCategory: "FileSharingApplication",
    operatingSystem: "Web",
    description:
      "ZipDrop is a free file and text sharing site that uses a 4-digit code.",
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
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}