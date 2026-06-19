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
    {
      url: "https://zip-drop.vercel.app/blog/airdrop-alternative-windows",
      lastModified: new Date(),
      
      priority: 0.8,
    },
    {
      url: "https://zip-drop.vercel.app/blog/airdrop-alternative-android",
      lastModified: new Date(),
     
      priority: 0.8,
    },
    {
      url: "https://zip-drop.vercel.app/blog/how-to-transfer-files-phone-to-laptop",
      lastModified: new Date(),
      
      priority: 0.8,
    },
    {
  url: "https://zip-drop.vercel.app/blog/share-files-without-login",
  lastModified: new Date(),
  priority: 0.8,
},
{
  url: "https://zip-drop.vercel.app/blog/send-large-files-online",
  lastModified: new Date(),
  priority: 0.8,
},
{
  url: "https://zip-drop.vercel.app/blog/how-to-share-files-between-phone-and-pc",
  lastModified: new Date(),
  priority: 0.8,
},
{
  url: "https://zip-drop.vercel.app/blog/best-file-sharing-website",
  lastModified: new Date(),
  priority: 0.8,
},
{
  url: "https://zip-drop.vercel.app/blog/transfer-files-android-to-pc",
  lastModified: new Date(),
  priority: 0.8,
},
{
  url: "https://zip-drop.vercel.app/blog/transfer-files-iphone-to-windows",
  lastModified: new Date(),
  priority: 0.8,
},
  ];
}