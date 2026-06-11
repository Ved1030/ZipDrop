import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://zip-drop.vercel.app",
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: "https://zip-drop.vercel.app/blog",
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: "https://zip-drop.vercel.app/blog/snapdrop-alternative",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://zip-drop.vercel.app/blog/wetransfer-alternative",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://zip-drop.vercel.app/blog/share-files-between-devices",
      lastModified: new Date(),
      priority: 0.8,
    },
     {
      url: "https://zip-drop.vercel.app/blog/airdrop-alternative",
    },
  ];
}