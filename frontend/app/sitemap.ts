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
];

const TRUST_PAGES = ["/about", "/contact", "/privacy", "/terms", "/report-abuse"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: SITE_URL, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, priority: 0.9 },
    ...BLOG_SLUGS.map((slug) => ({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...TRUST_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      priority: 0.4,
    })),
  ];
}
