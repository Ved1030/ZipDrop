"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, Code2, Gauge, Laptop, Lock, ShieldCheck, Upload } from "lucide-react";
import UploadCard from "./UploadCard";
import ReceiveCard from "./ReceiveCard";


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
    <section style={{ animation: "fadeInUp 0.8s 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
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

function HowItWorks() {
  return (
    <section className="hiw" style={{ animation: "fadeInUp 0.8s 0.5s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
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
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(8px, 1.4vh, 12px)",
            textAlign: "center",
            maxWidth: "640px",
            animation: "fadeInDown 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          {/* Top badge */}
          <div className="badge" style={{ fontSize: "11px", padding: "5px 14px" }}>
            <span className="badge-dot" />
            No sign-up · Up to 1 GB per file · 4-digit code
          </div>

          {/* Brand line */}
          <p style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--primary-teal)",
          }}>
            ZipDrop · Free Online Clipboard
          </p>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(36px, min(5vw, 7.5vh), 62px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            color: "var(--text-primary)",
          }}>
            Share Text and Files
            <br />
            Between Devices{" "}
            <span
              className="glow-text"
              style={{
                position: "relative",
                display: "inline-block",
              }}
            >
              Instantly
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
            maxWidth: "620px",
          }}>
            ZipDrop is a free online clipboard and file-sharing tool. Paste text
            or upload files, get a 4-digit code, and open it on any device — no
            signup or installation required.
          </p>

          <a
            href="/online-clipboard"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--primary-teal)",
              textDecoration: "none",
            }}
          >
            Learn how the online clipboard works →
          </a>
        </section>

        {/* ── CARDS SECTION ── */}
        <section
          style={{
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
            justifyContent: "center",
            width: "100%",
            maxWidth: "900px",
          }}
        >
          <UploadCard />
          <ReceiveCard 
            onFileReceived={(file: any) => set_zd_currentFile(file)}
            set_zd_editorOpen={set_zd_editorOpen}
            set_zd_currentFile={set_zd_currentFile}
          />
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