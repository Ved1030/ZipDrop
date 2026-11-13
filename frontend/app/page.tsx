"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, Code2, Gauge, Laptop, Lock, ShieldCheck, Upload, FileText, Image, Table, Settings } from "lucide-react";
import UploadCard from "../components/UploadCard";
import ReceiveCard from "../components/ReceiveCard";


/* ─── Subtle Background Waves ──────────── */

function ParticleBackground() {
  return (
    <div className="bg-waves" aria-hidden="true">
      <span className="wave wave-top" />
      <span className="wave wave-bottom" />
    </div>
  );
}

/* ─── Logo ────────────────────────────── */

function ZipDropLogo() {
  return (
    <div
      className="logo-icon"
      style={{
        width: 48,
        height: 48,
        background: "var(--teal-light)",
        border: "1px solid rgba(7,140,145,0.28)",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(7,140,145,0.10)",
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#078C91" strokeWidth="1.8">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91A16 16 0 0015.1 17.9l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    </div>
  );
}


/* ─── Stats strip ──────────────────────── */

function StatsStrip() {
  const [stats, setStats] = useState<{ files: number; transfers: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.visible) {
          setStats({ files: data.files, transfers: data.transfers });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  const items = [
    { label: "Files shared", value: stats.files.toLocaleString("en-US") },
    { label: "Transfers", value: stats.transfers.toLocaleString("en-US") },
  ];

  return (
    <section id="stats" style={{ animation: "fadeInUp 0.8s 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
      <div style={{
        display: "flex",
        gap: "32px",
        justifyContent: "center",
        flexWrap: "wrap",
        margin: "0 auto",
        padding: "0 24px",
      }}>
        {items.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--primary-teal)", fontFamily: "var(--font-mono)" }}>
              {s.value}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── How It Works ────────────────────── */

const HOW_STEPS = [
  { step: "01", title: "Upload", desc: "Drop your files or paste text into the Share panel.", icon: Upload, bg: "var(--green-light)", color: "var(--green-highlight)" },
  { step: "02", title: "Get Code", desc: "A unique 4-digit code is generated instantly.", icon: Code2, bg: "var(--blue-light)", color: "var(--secondary-blue)" },
  { step: "03", title: "Receive", desc: "Enter the code on any device to retrieve your content.", icon: ArrowDownToLine, bg: "var(--purple-light)", color: "var(--purple-highlight)" },
];

const BENEFITS = [
  { title: "Fast Transfer", desc: "Share in seconds.", icon: Gauge },
  { title: "No Sign-up", desc: "Use without an account.", icon: Lock },
  { title: "Private & Secure", desc: "Direct and encrypted transfer.", icon: ShieldCheck },
  { title: "Cross-Device", desc: "Works on phone, tablet and PC.", icon: Laptop },
];

/* ─── Conversion Tools Card ──────────────── */

function ConversionToolsCard() {
  return (
    <Link
      href="/conversion"
      style={{
        textDecoration: "none",
        color: "inherit",
        width: "100%",
        maxWidth: "420px",
        display: "block",
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "clamp(20px, 2.6vh, 28px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(16px, 2.2vh, 20px)",
          animation: "fadeInUp 0.6s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        {/* CARD HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "var(--purple-light)",
              border: "1px solid rgba(135,59,197,0.24)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--purple-highlight)",
            }}>
              <Settings size={18} strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                Convert
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Professional file conversion tools
              </p>
            </div>
          </div>
          <span className="badge">
            <span className="badge-dot" style={{ background: "var(--purple-highlight)" }} />
            New
          </span>
        </div>

        {/* DIVIDER */}
        <div className="divider" />

        {/* TOOL PREVIEW */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { icon: FileText, label: "PDF to Word", desc: "Editable DOCX with layout preservation", color: "var(--secondary-blue)" },
            { icon: FileText, label: "Word to PDF", desc: "High-fidelity PDF from DOCX/DOC", color: "var(--primary-teal)" },
            { icon: Image, label: "PDF to JPG/PNG", desc: "Rasterize pages at custom DPI", color: "var(--green-highlight)" },
            { icon: Image, label: "Images to PDF", desc: "Combine multiple images into one PDF", color: "var(--purple-highlight)" },
          ].map((tool, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "10px", transition: "all 0.2s ease" }}>
              <div style={{ width: 36, height: 36, borderRadius: "9px", background: tool.color + "20", border: `1px solid ${tool.color}40`, display: "flex", alignItems: "center", justifyContent: "center", color: tool.color, flexShrink: 0 }}>
                <tool.icon size={18} strokeWidth={2} aria-hidden="true" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {tool.label}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {tool.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA BUTTON */}
        <div
          className="btn-cyan"
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span className="shimmer" />
          Open Conversion Tools
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

/* ─── How It Works ────────────────────── */

function HowItWorks() {
  return (
    <section id="how-it-works" className="hiw" style={{ animation: "fadeInUp 0.8s 0.5s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
      <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        How it works
      </h2>

      <div className="hiw-steps">
        {HOW_STEPS.map(({ step, title, desc, icon: Icon, bg, color }) => (
          <div key={step} className="glass-card hiw-step">
            <div className="hiw-icon" style={{ background: bg, color }}>
              <Icon size={24} strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="hiw-body">
              <span className="hiw-badge" style={{ background: bg, color }}>
                {step}
              </span>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                {title}
              </h3>
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card hiw-benefits">
        {BENEFITS.map(({ title, desc, icon: Icon }) => (
          <div key={title} className="hiw-benefit">
            <span className="hiw-benefit-icon">
              <Icon size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <p style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                {title}
              </p>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Page ────────────────────────────── */

export default function Home() {
  const [zd_editorOpen, set_zd_editorOpen] = useState(false);
  const [zd_currentFile, set_zd_currentFile] = useState<any>(null);
  const [zd_resendCode, set_zd_resendCode] = useState<string | null>(null);

  return (
    <>
      {/* Background layers */}
      <ParticleBackground />


      <main
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "clamp(20px, 3vh, 40px)",
          paddingBottom: "clamp(40px, 6vh, 64px)",
          paddingLeft: "24px",
          paddingRight: "24px",
          gap: "clamp(18px, 2.6vh, 32px)",
        }}
      >
        {/* ── HERO SECTION ── */}
        <section id="home" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(8px, 1.4vh, 12px)",
          textAlign: "center",
          maxWidth: "640px",
          animation: "fadeInDown 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}>
          {/* Top badge */}
          <div className="badge" style={{ fontSize: "11px", padding: "5px 14px" }}>
            <span className="badge-dot" />
            No sign-up · Up to 1 GB per file · 4-digit code
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(48px, min(6.5vw, 9vh), 80px)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
          }}>
            Zip<span
              className="glow-text"
              style={{
                position: "relative",
                display: "inline-block",
              }}
            >
              Drop
              <span style={{
                position: "absolute",
                bottom: -6,
                left: 0,
                right: 0,
                height: 3,
                background: "linear-gradient(90deg, transparent, var(--primary-teal), transparent)",
                borderRadius: 2,
              }} />
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: "clamp(14px, 1.4vw, 17px)",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: "600px",
          }}>
            ZipDrop lets you share files and text across devices in a few steps.
            Upload, get a code, receive—no accounts needed.
          </p>
        </section>

        {/* ── CARDS SECTION ── */}
        <section id="tools" style={{
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          maxWidth: "900px",
        }}>
          <UploadCard />
          <ReceiveCard 
            onFileReceived={(file: any) => set_zd_currentFile(file)}
            set_zd_editorOpen={set_zd_editorOpen}
            set_zd_currentFile={set_zd_currentFile}
          />
          <ConversionToolsCard />
        </section>

        {/* Editor opens in a new tab via ZDOpenEditButton — no drawer */}

        {/* ── STATS ── */}
        <StatsStrip />

        {/* ── HOW IT WORKS ── */}
        <HowItWorks />
      </main>
    </>
  );
}