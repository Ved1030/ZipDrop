import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Faq } from "@/components/BlogArticle";
import { AUTHORS, SITE_URL } from "@/lib/site";
import styles from "./online-clipboard.module.css";

const PAGE_PATH = "/online-clipboard";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const title =
  "Free Online Clipboard – Share Text & Files Between Devices | ZipDrop";
const description =
  "Use ZipDrop as a free online clipboard to share text, links and files between your phone and laptop. Get a 4-digit code and open it on any device — no signup or app.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title,
    description,
    url: PAGE_URL,
    siteName: "ZipDrop",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZipDrop online clipboard for sharing text and files between devices",
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

const FAQS = [
  {
    q: "Is ZipDrop a free online clipboard?",
    a: "Yes. ZipDrop is free to use and does not require an account or an app. You can send text and links up to 50,000 characters, or up to 10 files of up to 1 GB each, and retrieve them on another device with a 4-digit code.",
  },
  {
    q: "How do I copy text from my phone to my laptop?",
    a: "Open ZipDrop on your phone, choose Share Text, paste the text and send it. Note the 4-digit code, open zip-drop.vercel.app on your laptop and enter the code in the Receive panel. Select and copy the text from the panel.",
  },
  {
    q: "Do both devices need to be on the same Wi-Fi network?",
    a: "No. ZipDrop stores the content on its server so the receiving device can fetch it with the code. The two devices can be on different networks, different mobile carriers, or in different locations.",
  },
  {
    q: "Can I transfer files without installing an app?",
    a: "Yes. Everything happens in the browser. Upload up to 10 files of up to 1 GB each, share the 4-digit code, and download the files on the other device. It works across Android, iPhone, Windows, macOS and Linux.",
  },
  {
    q: "How long does a ZipDrop code stay valid?",
    a: "Each transfer records a 48-hour expiry timestamp. Expiry is not automatically enforced yet, so retrieve your content promptly and do not use ZipDrop as long-term storage.",
  },
  {
    q: "Is an online clipboard private?",
    a: "Traffic uses HTTPS, but ZipDrop does not provide end-to-end encryption. Files are stored on the server in a publicly readable storage bucket, and a 4-digit code can be guessed. Do not send passwords, financial data or confidential documents.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}/#webpage`,
      url: PAGE_URL,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      breadcrumb: { "@id": `${PAGE_URL}/#breadcrumb` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${SITE_URL}/screenshots/zipdrop-home-share-panel.webp`,
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${PAGE_URL}/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Online clipboard",
          item: PAGE_URL,
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function OnlineClipboardPage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Online clipboard</li>
        </ol>
      </nav>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>Online clipboard guide</p>
        <h1>Free Online Clipboard for Text and Files</h1>
        <p className={styles.lede}>
          An online clipboard moves text, links and files between devices
          through the browser. ZipDrop makes it concrete: paste or upload on one
          device, get a 4-digit code, and open that code on another device. No
          account and no app installation are required.
        </p>
        <div className={styles.ctaRow}>
          <Link className="zd-blog-cta" href="/">
            Open ZipDrop
          </Link>
          <a className={styles.secondaryCta} href="#how-it-works">
            See how it works
          </a>
        </div>
        <p className={styles.meta}>
          By {AUTHORS[0].name} and {AUTHORS[1].name} · Updated{" "}
          <time dateTime="2026-11-13">13 November 2026</time>
        </p>
      </header>

      <section>
        <h2>What is an online clipboard?</h2>
        <p>
          Your operating system clipboard holds copied content on one device.
          An <strong>online clipboard</strong> is a web page that stores content
          temporarily so a different device can pick it up. The two devices do
          not need to share an operating system, an account or a local network;
          they only need a browser and the same retrieval token.
        </p>
        <p>
          Most tools in this category use a short numeric code or a link as that
          token. ZipDrop uses four digits, which is short enough to read aloud
          over a call or type from memory. The code is the only thing you carry
          between devices.
        </p>
        <p>
          An online clipboard is not the same as automatic clipboard sync.
          Features such as Apple Universal Clipboard or Microsoft Phone Link
          copy items in the background between devices signed in to the same
          account. An online clipboard is a deliberate send: you choose what to
          share, and you retrieve it on the other side.
        </p>
      </section>

      <section id="how-it-works">
        <h2>How ZipDrop works</h2>
        <ol className={styles.steps}>
          <li>
            <strong>Share or upload.</strong> On the ZipDrop homepage, paste
            text into the Share Text tab or choose up to 10 files of up to 1 GB
            each.
          </li>
          <li>
            <strong>Get a 4-digit code.</strong> ZipDrop returns a code for that
            transfer. Text can be up to 50,000 characters.
          </li>
          <li>
            <strong>Receive anywhere.</strong> Open ZipDrop on the other device,
            enter the code in the Receive panel, and the text appears or the
            files download.
          </li>
        </ol>

        <figure className={styles.figure}>
          <Image
            src="/screenshots/zipdrop-home-share-panel.webp"
            alt="ZipDrop homepage showing the Share panel with file and text tabs and the Receive panel with a 4-digit code field"
            width={1280}
            height={900}
            sizes="(max-width: 820px) 100vw, 820px"
            className={styles.shot}
          />
          <figcaption>
            The ZipDrop homepage: share text or files on the left, enter a
            4-digit code on the right.
          </figcaption>
        </figure>
      </section>

      <section>
        <h2>How to share text between a phone and a laptop</h2>
        <ol className={styles.steps}>
          <li>
            Open{" "}
            <Link className="zd-blog-link" href="/">
              ZipDrop
            </Link>{" "}
            on your phone and switch to the <strong>Share Text</strong> tab.
          </li>
          <li>Paste or type the text, then send it and note the 4-digit code.</li>
          <li>Open ZipDrop on the laptop and type the code in the Receive panel.</li>
          <li>Select the text in the panel and copy it into any app on the laptop.</li>
        </ol>
        <p>
          To go the other direction, repeat the steps from the laptop and enter
          the code on the phone. The text limit is 50,000 characters, which
          covers long URLs, code snippets, notes and most email drafts.
        </p>

        <figure className={styles.figure}>
          <Image
            src="/screenshots/zipdrop-mobile-home.webp"
            alt="ZipDrop Share and Receive panels stacked vertically on a phone screen"
            width={684}
            height={1502}
            sizes="(max-width: 820px) 90vw, 390px"
            className={`${styles.shot} ${styles.shotMobile}`}
          />
          <figcaption>
            On a phone, the Share and Receive panels stack vertically so the
            code field stays within reach.
          </figcaption>
        </figure>
      </section>

      <section>
        <h2>How to transfer files without installing an app</h2>
        <p>
          ZipDrop runs in the browser on both sides. There is nothing to install
          on Android, iPhone, Windows, macOS or Linux, and the devices do not
          need to be on the same Wi-Fi network.
        </p>
        <ol className={styles.steps}>
          <li>
            On the sending device, open the <strong>Share File</strong> tab and
            add up to 10 files. The limit is 1 GB per file.
          </li>
          <li>Send the files and copy the 4-digit code.</li>
          <li>
            On the receiving device, open ZipDrop, enter the code in the Receive
            panel and download each file.
          </li>
        </ol>
        <p>
          Photos, videos, PDFs, archives and office documents keep their
          original format. Document types supported by the built-in editor can
          also be opened, edited and shared again under a new code.
        </p>
      </section>

      <section>
        <h2>Benefits and limitations</h2>
        <div className={styles.twoCol}>
          <div className={styles.card}>
            <h3>What it is good at</h3>
            <ul>
              <li>No account, no app and no fee.</li>
              <li>Works across Android, iPhone, Windows, macOS and Linux.</li>
              <li>Text and files use the same 4-digit code.</li>
              <li>Devices can be on different networks or in different cities.</li>
              <li>Files stay in their original format and can be downloaded again with the code.</li>
            </ul>
          </div>
          <div className={styles.card}>
            <h3>What to keep in mind</h3>
            <ul>
              <li>
                It is a manual send, not automatic clipboard sync between your
                devices.
              </li>
              <li>
                A 4-digit code is short and can be guessed, so do not use ZipDrop
                for passwords or confidential documents.
              </li>
              <li>
                Traffic uses HTTPS, but there is no end-to-end encryption. Files
                are stored on the server in a publicly readable storage bucket.
              </li>
              <li>
                A 48-hour expiry timestamp is recorded for each transfer, but
                expiry is not automatically enforced yet.
              </li>
              <li>
                Limits: 10 files per transfer, 1 GB per file, 50,000 characters
                of text.
              </li>
            </ul>
          </div>
        </div>
        <p>
          For a closer comparison with other services, see{" "}
          <Link className="zd-blog-link" href="/blog/online-clipboard-alternatives">
            online clipboard alternatives
          </Link>{" "}
          and{" "}
          <Link className="zd-blog-link" href="/blog/zipdrop-vs-online-clipboard">
            ZipDrop vs Online Clipboard
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 id="faq">Online clipboard FAQs</h2>
        <Faq items={FAQS} />
      </section>

      <section>
        <h2>Related guides</h2>
        <ul className={styles.related}>
          <li>
            <Link className="zd-blog-link" href="/blog/online-clipboard">
              Online clipboard: copy and paste between phone and PC
            </Link>
          </li>
          <li>
            <Link className="zd-blog-link" href="/blog/online-clipboard-without-login">
              Online clipboard without login
            </Link>
          </li>
          <li>
            <Link className="zd-blog-link" href="/blog/share-text-files-between-devices">
              How to share text and files between devices
            </Link>
          </li>
          <li>
            <Link className="zd-blog-link" href="/blog/how-to-share-files-between-phone-and-pc">
              How to share files between phone and PC
            </Link>
          </li>
          <li>
            <Link className="zd-blog-link" href="/blog/file-transfer-without-usb">
              Transfer files without a USB cable
            </Link>
          </li>
          <li>
            <Link className="zd-blog-link" href="/blog/send-files-via-link">
              Send files via link vs a 4-digit code
            </Link>
          </li>
        </ul>
        <div className={styles.ctaRow}>
          <Link className="zd-blog-cta" href="/">
            Try ZipDrop free — no account needed
          </Link>
        </div>
      </section>
    </main>
  );
}
