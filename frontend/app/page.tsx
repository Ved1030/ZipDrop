import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { SITE_URL, AUTHORS } from "@/lib/site";

const title = "ZipDrop – Free Online Clipboard & File Sharing Tool";
const description =
  "ZipDrop is a free online clipboard and file-sharing tool that lets you share text, links and files between devices using a simple code. No signup or installation required.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: SITE_URL,
    siteName: "ZipDrop",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZipDrop – free online clipboard and file sharing between devices",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#software`,
  name: "ZipDrop",
  alternateName: "ZipDrop Online Clipboard",
  url: SITE_URL,
  description:
    "A free browser-based online clipboard and file-sharing tool. Send text, links or up to 10 files (1 GB each) and retrieve them on another device with a 4-digit code. No account or installation required.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript",
  isAccessibleForFree: true,
  inLanguage: "en",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Share text and links with a 4-digit code",
    "Share up to 10 files per transfer, up to 1 GB each",
    "Works across phone, tablet and desktop browsers",
    "No account or installation required",
    "Optional in-browser document editing",
  ],
  screenshot: `${SITE_URL}/screenshots/zipdrop-home-share-panel.webp`,
  creator: AUTHORS.map((author) => ({
    "@type": "Person",
    name: author.name,
    sameAs: author.linkedin,
    affiliation: {
      "@type": "CollegeOrUniversity",
      name: "DJ Sanghvi College of Engineering",
    },
  })),
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
