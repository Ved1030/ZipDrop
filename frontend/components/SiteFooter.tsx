"use client";

import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import {
  AUTHORS,
  CONTACT_EMAIL,
  GITHUB_URL,
} from "@/lib/site";
import ZipDropLogo from "./brand/ZipDropLogo";

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
  marginBottom: "16px",
};

const columnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

export default function SiteFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/editor")) return null;

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-main)",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "48px 24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        {/* Main footer grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr repeat(3, 1fr)",
            gap: "40px",
          }}
        >
          {/* Left section - Brand */}
          <div style={{ maxWidth: "320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <ZipDropLogo size="small" />
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "var(--text-secondary)",
              }}
            >
              Your all-in-one file utility platform. Share, convert, edit, compress and manage files securely.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`}
              style={{ ...linkStyle, display: "inline-block", marginTop: "20px", color: "var(--primary-teal)", fontWeight: 500 }}
            >
              Send feedback
            </a>
          </div>

          {/* Tools section */}
          <nav aria-label="Tools" style={columnStyle}>
            <p style={headingStyle}>Tools</p>
            <a href="/conversion?category=pdf-tools" style={linkStyle}>PDF Tools</a>
            <a href="/conversion?category=document-tools" style={linkStyle}>Document Tools</a>
            <a href="/conversion?category=image-tools" style={linkStyle}>Image Tools</a>
            <a href="/conversion?category=compression-tools" style={linkStyle}>Compression Tools</a>
            <a href="/conversion" style={linkStyle}>Conversion Tools</a>
            <a href="/conversion?category=text-tools" style={linkStyle}>Text Tools</a>
            <a href="/conversion?category=utility-tools" style={linkStyle}>Utility Tools</a>
            <a href="/editor" style={linkStyle}>Online Editor</a>
          </nav>

          {/* Company section */}
          <nav aria-label="Company" style={columnStyle}>
            <p style={headingStyle}>Company</p>
            <a href="/about" style={linkStyle}>About</a>
            <a href="/contact" style={linkStyle}>Contact</a>
            <a href={`mailto:${CONTACT_EMAIL}?subject=ZipDrop%20feedback`} style={linkStyle}>Send Feedback</a>
          </nav>

          {/* Legal section */}
          <nav aria-label="Legal" style={columnStyle}>
            <p style={headingStyle}>Legal</p>
            <a href="/privacy" style={linkStyle}>Privacy Policy</a>
            <a href="/terms" style={linkStyle}>Terms of Use</a>
          </nav>
        </div>

        {/* Bottom section */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "24px",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
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
              style={{ ...linkStyle, fontSize: "12px", color: "var(--text-secondary)" }}
            >
              Ved Mehta
            </a>{" "}
            &{" "}
            <a
              href={AUTHORS[1].linkedin}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkStyle, fontSize: "12px", color: "var(--text-secondary)" }}
            >
              Virti Panchamia
            </a>
          </p>
          <p style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
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

        <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "8px" }}>
          ZipDrop is an independent project and is not affiliated with Apple,
          Google, Microsoft, Snapdrop, or WeTransfer.
        </p>
      </div>
    </footer>
  );
}