import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Online File Converter – PDF, Word, Excel, Images & More",
  description: "Convert files online for free with ZipDrop. 30+ conversion tools for PDF, Word, Excel, PowerPoint, images, and more. No account required, no software to install.",
  openGraph: {
    title: "Free Online File Converter – PDF, Word, Excel, Images & More",
    description: "Convert files online for free with ZipDrop. 30+ conversion tools for PDF, Word, Excel, PowerPoint, images, and more. No account required.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online File Converter – PDF, Word, Excel, Images & More",
    description: "Convert files online for free with ZipDrop. 30+ conversion tools. No account required.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Free Online File Converter",
  description: "Convert files online for free with ZipDrop. 30+ conversion tools for PDF, Word, Excel, PowerPoint, images, and more. No account required.",
  url: "https://zip-drop.vercel.app/conversion",
  publisher: {
    "@type": "Organization",
    name: "ZipDrop",
    url: "https://zip-drop.vercel.app",
  },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "PDF to Word" },
      { "@type": "ListItem", position: 2, name: "PDF to Excel" },
      { "@type": "ListItem", position: 3, name: "PDF to PowerPoint" },
      { "@type": "ListItem", position: 4, name: "Word to PDF" },
      { "@type": "ListItem", position: 5, name: "Excel to PDF" },
      { "@type": "ListItem", position: 6, name: "JPG to PNG" },
      { "@type": "ListItem", position: 7, name: "PNG to JPG" },
      { "@type": "ListItem", position: 8, name: "Images to PDF" },
    ],
  },
};

export default function ConversionLayout({
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