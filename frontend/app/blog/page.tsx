import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides: File Sharing, Online Clipboard and Cross-Device Transfer",
  description:
    "Practical guides to sharing files and text between phones, tablets and computers, including online clipboard tools, AirDrop alternatives and app-free transfers.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "ZipDrop Guides: File Sharing and Online Clipboard",
    description:
      "Practical guides to sharing files and text between phones, tablets and computers.",
    url: "/blog",
    siteName: "ZipDrop",
    type: "website",
  },
};

export default function BlogPage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1>ZipDrop Blog</h1>

      <ul>
        <li>
          <Link href="/online-clipboard">
            Free Online Clipboard for Text and Files
          </Link>
        </li>
        <li>
          <a href="/blog/snapdrop-alternative">
            Best Snapdrop Alternative
          </a>
        </li>

        <li>
          <a href="/blog/wetransfer-alternative">
            Best WeTransfer Alternative
          </a>
        </li>

        <li>
          <a href="/blog/share-files-between-devices">
            Share Files Between Devices
          </a>
        </li>
         <li>
      <a href="/blog/airdrop-alternative">
        Best AirDrop Alternative
      </a>
    </li>
        <li>
          <a href="/blog/online-clipboard">
            Online Clipboard: Copy and Paste Between Your Phone and PC
          </a>
        </li>
        <li>
          <a href="/blog/online-clipboard-alternatives">
            Online Clipboard Alternatives
          </a>
        </li>
        <li>
          <a href="/blog/zipdrop-vs-online-clipboard">
            ZipDrop vs Online Clipboard
          </a>
        </li>
        <li>
          <a href="/blog/online-clipboard-without-login">
            Online Clipboard Without Login
          </a>
        </li>
        <li>
          <a href="/blog/share-text-files-between-devices">
            How to Share Text and Files Between Devices
          </a>
        </li>
      </ul>
    </main>
  );
}