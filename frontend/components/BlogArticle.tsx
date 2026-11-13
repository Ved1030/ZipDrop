import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_URL, AUTHORS } from "@/lib/site";
import styles from "./BlogArticle.module.css";

export type FaqItem = { q: string; a: string };

export type BlogMeta = {
  slug: string;
  title: string;
  description: string;
  published: string;
  modified: string;
  /** H2 sections to include in the BlogPosting articleSection list */
  sections: string[];
  faqs: FaqItem[];
};

type Props = {
  meta: BlogMeta;
  h1: string;
  intro: ReactNode;
  children: ReactNode;
  related: { href: string; label: string }[];
};

export const BLOG_AUTHOR = {
  name: AUTHORS[0].name,
  url: AUTHORS[0].linkedin,
  secondAuthor: AUTHORS[1].name,
};

export function blogMetadata(meta: BlogMeta) {
  const url = `${SITE_URL}/blog/${meta.slug}`;
  const image = { url: "/og-image.png", width: 1200, height: 630, alt: meta.title };
  return {
    title: meta.title,
    description: meta.description,
    keywords: ["online clipboard", "online clipboard for phone and PC"],
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: "ZipDrop",
      type: "article" as const,
      publishedTime: meta.published,
      modifiedTime: meta.modified,
      authors: [BLOG_AUTHOR.name, BLOG_AUTHOR.secondAuthor],
      images: [image],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: meta.title,
      description: meta.description,
      images: ["/og-image.png"],
    },
  };
}

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className={styles.faq}>
      {items.map((item) => (
        <details key={item.q} open>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}

export function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={cell} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={`${row[0]}-${i}`}>{cell}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuthorBox() {
  return (
    <aside className={styles.author} aria-label="About the authors">
      <p>
        <strong>About the authors:</strong> {BLOG_AUTHOR.name} and{" "}
        {BLOG_AUTHOR.secondAuthor} are engineering students at DJ Sanghvi
        College of Engineering who build and maintain ZipDrop. This article
        describes features you can check directly on the{" "}
        <Link className="zd-blog-link" href="/">
          ZipDrop homepage
        </Link>
        .
      </p>
    </aside>
  );
}

export default function BlogArticle({ meta, h1, intro, children, related }: Props) {
  const url = `${SITE_URL}/blog/${meta.slug}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: meta.published,
    dateModified: meta.modified,
    inLanguage: "en",
    articleSection: meta.sections,
    about: { "@type": "Thing", name: "Online clipboard" },
    author: [
      { "@type": "Person", name: BLOG_AUTHOR.name, url: BLOG_AUTHOR.url },
      { "@type": "Person", name: BLOG_AUTHOR.secondAuthor },
    ],
    publisher: { "@type": "Organization", name: "ZipDrop", url: SITE_URL },
    image: `${SITE_URL}/og-image.png`,
    isPartOf: { "@type": "Blog", name: "ZipDrop Blog", url: `${SITE_URL}/blog` },
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: h1, item: url },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className={styles.article}>
      <JsonLd data={article} />
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqPage} />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/blog">Blog</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{h1}</li>
        </ol>
      </nav>

      <article>
        <h1>{h1}</h1>
        <p className={styles.meta}>
          By {BLOG_AUTHOR.name} and {BLOG_AUTHOR.secondAuthor}
          <span aria-hidden="true"> · </span>
          <time dateTime={meta.published}>Published {meta.published}</time>
          {meta.modified !== meta.published && (
            <>
              <span aria-hidden="true"> · </span>
              <time dateTime={meta.modified}>Updated {meta.modified}</time>
            </>
          )}
        </p>

        <p className={styles.lede}>{intro}</p>

        {children}

        <h2 id="faq">Frequently asked questions</h2>
        <Faq items={meta.faqs} />

        <AuthorBox />

        <Link className={`zd-blog-cta ${styles.cta}`} href="/">
          Try ZipDrop free — no account needed
        </Link>

        <h2 id="related">Related reading</h2>
        <ul className={styles.related}>
          {related.map((r) => (
            <li key={r.href}>
              <a className="zd-blog-link" href={r.href}>
                {r.label}
              </a>
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
