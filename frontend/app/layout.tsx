import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Script from "next/script";
import SiteFooter from "@/components/SiteFooter";
import { AUTHORS, CONTACT_EMAIL, GITHUB_URL, LINKEDIN, SITE_URL } from "@/lib/site";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "ZipDrop – Free Online Clipboard & File Sharing Tool",
    template: "%s | ZipDrop",
  },

  description:
    "ZipDrop is a free online clipboard and file-sharing tool. Share text, links and up to 10 files (1 GB each) between devices with a 4-digit code — no signup or installation.",

  keywords: [
    "ZipDrop",
    "online clipboard",
    "free online clipboard",
    "online clipboard alternative",
    "share text between phone and PC",
    "transfer files without app",
    "cross-device file sharing",
    "file sharing",
    "text sharing",
    "file transfer",
    "share files online",
    "4 digit code sharing",
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
    title: "ZipDrop – Free Online Clipboard & File Sharing Tool",
    description:
      "Share text, links and files between devices with a 4-digit code. Up to 10 files, 1 GB per file, no account or installation.",
    url: SITE_URL,
    siteName: "ZipDrop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZipDrop – free online clipboard and file sharing between devices",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZipDrop – Free Online Clipboard & File Sharing Tool",
    description:
      "Share text, links and files between devices with a 4-digit code. No signup or installation.",
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
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "ZipDrop",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo.png`,
          width: 512,
          height: 512,
        },
        email: CONTACT_EMAIL,
        founder: AUTHORS.map((author) => ({
          "@type": "Person",
          name: author.name,
          url: author.linkedin,
        })),
        sameAs: [GITHUB_URL, LINKEDIN.ved, LINKEDIN.virti],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "ZipDrop",
        description:
          "Free online clipboard and file-sharing tool for sending text, links and files between devices with a 4-digit code.",
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#organization` },
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