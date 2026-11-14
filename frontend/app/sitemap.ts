import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const BLOG_SLUGS = [
  "snapdrop-alternative",
  "wetransfer-alternative",
  "share-files-between-devices",
  "airdrop-alternative",
  "airdrop-alternative-windows",
  "airdrop-alternative-android",
  "how-to-transfer-files-phone-to-laptop",
  "share-files-without-login",
  "send-large-files-online",
  "how-to-share-files-between-phone-and-pc",
  "best-file-sharing-website",
  "transfer-files-android-to-pc",
  "transfer-files-iphone-to-windows",
  "transfer-files-iphone-to-android",
  "send-photos-from-phone-to-laptop",
  "file-transfer-without-usb",
  "mobile-to-pc-file-transfer",
  "phone-to-pc-file-transfer",
  "transfer-files-from-phone-to-pc-wireless",
  "transfer-files-from-android-to-pc-wireless",
  "android-file-transfer-windows",
  "file-transfer-website",
  "web-file-transfer",
  "file-sharing-websites",
  "upload-and-share-files",
  "send-files-via-link",
  "online-clipboard",
  "online-clipboard-alternatives",
  "online-clipboard-without-login",
  "zipdrop-vs-online-clipboard",
  "share-text-files-between-devices",
  "share-files-online",
  "send-files-online-free",
];

const CONVERSION_PAGES = [
  "/conversion",
  "/conversion/pdf-to-word",
  "/conversion/pdf-to-excel",
  "/conversion/pdf-to-ppt",
  "/conversion/pdf-to-jpg",
  "/conversion/pdf-to-png",
  "/conversion/pdf-to-txt",
  "/conversion/pdf-to-html",
  "/conversion/pdf-to-pdfa",
  "/conversion/word-to-pdf",
  "/conversion/excel-to-pdf",
  "/conversion/ppt-to-pdf",
  "/conversion/word-to-txt",
  "/conversion/word-to-html",
  "/conversion/excel-to-csv",
  "/conversion/csv-to-excel",
  "/conversion/txt-to-pdf",
  "/conversion/html-to-pdf",
  "/conversion/rtf-to-word",
  "/conversion/images-to-pdf",
  "/conversion/jpg-to-png",
  "/conversion/png-to-jpg",
  "/conversion/webp-to-jpg",
  "/conversion/jpg-to-webp",
  "/conversion/png-to-webp",
  "/conversion/svg-to-png",
];

const COMPRESSION_PAGES = [
  "/compression",
  "/compression/pdf",
  "/compression/jpg",
  "/compression/png",
  "/compression/webp",
];

const TOOL_CATEGORY_PAGES = [
  "/conversion?category=pdf-tools",
  "/conversion?category=document-tools",
  "/conversion?category=image-tools",
  "/conversion?category=compression-tools",
  "/conversion?category=text-tools",
  "/conversion?category=utility-tools",
];

const TRUST_PAGES = ["/about", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: SITE_URL, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/editor`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/conversion`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/compression`, lastModified: now, priority: 0.8 },
    ...BLOG_SLUGS.map((slug) => ({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...CONVERSION_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...COMPRESSION_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...TOOL_CATEGORY_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...TRUST_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      priority: 0.4,
    })),
  ];
}
