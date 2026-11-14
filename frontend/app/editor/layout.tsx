import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Online Document Editor – Edit Word, PDF, Text Files",
  description: "Edit DOCX, PDF, TXT, and Markdown documents online for free with ZipDrop. No account required. Open shared documents, edit them, and share edited copies with a new code.",
  openGraph: {
    title: "Free Online Document Editor – Edit Word, PDF, Text Files",
    description: "Edit DOCX, PDF, TXT, and Markdown documents online for free with ZipDrop. No account required. Share edited copies with a 4-digit code.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online Document Editor – Edit Word, PDF, Text Files",
    description: "Edit DOCX, PDF, TXT, and Markdown documents online for free. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ZipDrop Online Editor",
  url: "https://zip-drop.vercel.app/editor",
  applicationCategory: "Editor",
  operatingSystem: "Web",
  description: "Free online document editor for DOCX, PDF, TXT, and Markdown files. No account required. Edit documents and share edited copies with a 4-digit code.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  creator: {
    "@type": "Organization",
    name: "ZipDrop",
    url: "https://zip-drop.vercel.app",
  },
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}