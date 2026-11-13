"use client";

import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import {
  AUTHORS,
  CONTACT_EMAIL,
  GITHUB_URL,
} from "@/lib/site";

const linkStyle: CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: "13px",
  textDecoration: "none",
};

const headingStyle: CSSProperties = {
  color: "var(--text-primary)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "12px",
};

const columnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

export default function SiteFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/editor")) return null;

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-soft)",
        background: "var(--bg-main)",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "40px 24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "40px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ maxWidth: "300px" }}>
            <p style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              ZipDrop
            </p>
            <p
              style={{
                marginTop: "8px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
              }}
            >
              Free file and text sharing with a 4-digit code. Up to 10 files,
              1 GB per file, no account needed.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`}
              style={{ ...linkStyle, display: "inline-block", marginTop: "12px", color: "var(--primary-teal)" }}
            >
              Send feedback
            </a>
          </div>

          <nav aria-label="Site" style={columnStyle}>
            <p style={headingStyle}>Site</p>
            <a href="/" style={linkStyle}>Home</a>
            <a href="/about" style={linkStyle}>About</a>
            <a href="/contact" style={linkStyle}>Contact</a>
          </nav>

          <nav aria-label="Legal" style={columnStyle}>
            <p style={headingStyle}>Legal</p>
            <a href="/privacy" style={linkStyle}>Privacy Policy</a>
            <a href="/terms" style={linkStyle}>Terms of Use</a>
          </nav>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border-soft)",
            paddingTop: "20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} ZipDrop · Built by{" "}
            <a
              href={AUTHORS[0].linkedin}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkStyle, fontSize: "12px" }}
            >
              Ved Mehta
            </a>{" "}
            &amp;{" "}
            <a
              href={AUTHORS[1].linkedin}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkStyle, fontSize: "12px" }}
            >
              Virti Panchamia
            </a>
          </p>
          <p style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkStyle, fontSize: "12px" }}
            >
              GitHub
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`}
              style={{ ...linkStyle, fontSize: "12px" }}
            >
              Feedback
            </a>
          </p>
        </div>

        <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
          ZipDrop is an independent project and is not affiliated with Apple,
          Google, Microsoft, Snapdrop, or WeTransfer.
        </p>
      </div>
    </footer>
  );
}
