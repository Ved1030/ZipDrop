import type { MetadataRoute } from "next";
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
  "free-file-transfer-online",
  "send-files-online-free",
  "share-files-online",
  "share-large-files-online",
  "transfer-files-online",
  "online-clipboard",
  "online-clipboard-alternatives",
  "online-clipboard-without-login",
  "zipdrop-vs-online-clipboard",
  "share-text-files-between-devices",
];

const CLIPBOARD_GUIDES = new Set([
  "online-clipboard",
  "online-clipboard-alternatives",
  "online-clipboard-without-login",
  "zipdrop-vs-online-clipboard",
  "share-text-files-between-devices",
]);

const TRUST_PAGES = ["/about", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const contentUpdated = new Date("2026-11-13");

  return [
    {
      url: SITE_URL,
      lastModified: contentUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/online-clipboard`,
      lastModified: contentUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: contentUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...BLOG_SLUGS.map((slug) => ({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: CLIPBOARD_GUIDES.has(slug) ? contentUpdated : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/editor`,
      lastModified: contentUpdated,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...TRUST_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
