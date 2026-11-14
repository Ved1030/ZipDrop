"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, Code2, Gauge, Laptop, Lock, ShieldCheck, Upload, FileText, Image, Table, Settings, ChevronRight, Archive, Type, QrCode, PenTool, FileVideo, FileAudio, FileArchive } from "lucide-react";
import UploadCard from "../components/UploadCard";
import ReceiveCard from "../components/ReceiveCard";
import Navbar from "../components/Navbar";
import ZipDropLogo from "../components/brand/ZipDropLogo";

/* ─── Background Waves ───────────────────── */

function ParticleBackground() {
  return (
    <div className="bg-waves" aria-hidden="true">
      <span className="wave wave-top" />
      <span className="wave wave-bottom" />
    </div>
  );
}

/* ─── HERO SECTION ──────────────────────── */

function Hero() {
  return (
    <section
      id="home"
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(12px, 1.8vh, 16px)",
        textAlign: "center",
        maxWidth: "720px",
        padding: "clamp(24px, 4vh, 48px) 24px",
        background: "transparent",
        animation: "fadeInDown 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      }}
    >
      {/* Top badge */}
      <div className="badge hero-badge" style={{ fontSize: "11px", padding: "5px 14px" }}>
        <span className="badge-dot" />
        Free · No Sign-up · 4-digit code
      </div>

      {/* Main brand logo */}
      <ZipDropLogo size="large" />

      {/* Description */}
      <p
        style={{
          fontSize: "clamp(18px, 2.2vw, 24px)",
          color: "var(--text-secondary)",
          lineHeight: 1.4,
          maxWidth: "640px",
          margin: 0,
          fontWeight: 400,
        }}
      >
        Share, convert, edit and manage your files — all in one place.
      </p>

      {/* Supporting text */}
      <p
        style={{
          fontSize: "clamp(14px, 1.5vw, 16px)",
          color: "var(--text-muted)",
          lineHeight: 1.6,
          maxWidth: "560px",
          margin: 0,
        }}
      >
        Fast, simple and accessible across your devices.
      </p>
    </section>
  );
}

/* ─── SHARE & RECEIVE PANELS ────────────── */

function ShareReceivePanels() {
  const [zd_editorOpen, set_zd_editorOpen] = useState(false);
  const [zd_currentFile, set_zd_currentFile] = useState<any>(null);
  const [zd_resendCode, set_zd_resendCode] = useState<string | null>(null);

  return (
    <section
      id="share-receive"
      style={{
        width: "100%",
        maxWidth: "1280px",
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
        justifyContent: "center",
        padding: "0 24px",
        animation: "fadeInUp 0.6s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      <UploadCard />
      <ReceiveCard
        onFileReceived={(file: any) => set_zd_currentFile(file)}
        set_zd_editorOpen={set_zd_editorOpen}
        set_zd_currentFile={set_zd_currentFile}
      />
    </section>
  );
}

/* ─── HOW IT WORKS ──────────────────────── */

const HOW_STEPS = [
  {
    step: "01",
    title: "Upload or Select",
    desc: "Drop files, paste text, or choose a conversion tool.",
    icon: Upload,
    bg: "var(--green-light)",
    color: "var(--green-highlight)",
  },
  {
    step: "02",
    title: "Get Code or Convert",
    desc: "Receive a 4-digit share code or start the conversion.",
    icon: Code2,
    bg: "var(--blue-light)",
    color: "var(--secondary-blue)",
  },
  {
    step: "03",
    title: "Receive, Edit, Download",
    desc: "Enter the code on any device to get files, edit documents, or download converted results.",
    icon: ArrowDownToLine,
    bg: "var(--purple-light)",
    color: "var(--purple-highlight)",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="hiw"
      style={{ animation: "fadeInUp 0.8s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      <h2
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        How ZipDrop Works
      </h2>

      <div className="hiw-steps">
        {HOW_STEPS.map(({ step, title, desc, icon: Icon, bg, color }) => (
          <div key={step} className="glass-card hiw-step" style={{ animationDelay: `${parseInt(step) * 80}ms` }}>
            <div className="hiw-icon" style={{ background: bg, color }}>
              <Icon size={24} strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="hiw-body">
              <span className="hiw-badge" style={{ background: bg, color }}>
                {step}
              </span>
              <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                {title}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── BENEFITS STRIP ────────────────────── */

const BENEFITS = [
  { title: "Fast Transfer", desc: "Share files in seconds.", icon: Gauge },
  { title: "No Sign-up", desc: "Use available features without creating an account.", icon: Lock },
  { title: "Private & Secure", desc: "Files transferred directly between devices via encrypted codes.", icon: ShieldCheck },
  { title: "Cross-Device", desc: "Works across supported phones, tablets and computers.", icon: Laptop },
];

function BenefitsStrip() {
  return (
    <section
      id="benefits"
      style={{
        width: "100%",
        maxWidth: "1280px",
        padding: "clamp(24px, 3.5vh, 32px) 24px",
        animation: "fadeInUp 0.8s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      <div className="benefits-strip">
        {BENEFITS.map(({ title, desc, icon: Icon }) => (
          <div key={title} className="benefit-item" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="benefit-icon" style={{ color: "var(--primary-teal)" }}>
              <Icon size={24} strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="benefit-content">
              <p className="benefit-title" style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</p>
              <p className="benefit-desc" style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── TOOL CATEGORIES ───────────────────── */

const TOOL_CATEGORIES = [
  {
    id: "pdf-tools",
    title: "PDF Tools",
    desc: "Merge, split, compress, rotate, protect and organize PDFs.",
    icon: FileText,
    color: "#168DBB",
    href: "/conversion?category=pdf-tools",
  },
  {
    id: "document-tools",
    title: "Document Tools",
    desc: "Create, edit and manage Word, Excel and PowerPoint documents.",
    icon: Type,
    color: "#25A653",
    href: "/conversion?category=document-tools",
  },
  {
    id: "image-tools",
    title: "Image Tools",
    desc: "Remove backgrounds, resize, crop and optimize images.",
    icon: Image,
    color: "#873BC5",
    href: "/conversion?category=image-tools",
  },
  {
    id: "compression-tools",
    title: "Compression Tools",
    desc: "Compress PDFs, images and files. Create and extract ZIP archives.",
    icon: Archive,
    color: "#647180",
    href: "/compression",
  },
  {
    id: "conversion-tools",
    title: "Conversion Tools",
    desc: "Convert PDFs, Office documents, images and other file formats.",
    icon: Settings,
    color: "#078C91",
    href: "/conversion",
  },
  {
    id: "text-tools",
    title: "Text Tools",
    desc: "Count words, compare text, change case and format content.",
    icon: Type,
    color: "#368BD2",
    href: "/conversion?category=text-tools",
  },
  {
    id: "utility-tools",
    title: "Utility Tools",
    desc: "Generate QR codes, calculate file hashes and inspect file details.",
    icon: QrCode,
    color: "#8054C8",
    href: "/conversion?category=utility-tools",
  },
  {
    id: "online-editor",
    title: "Online Editor",
    desc: "Edit supported Word documents and PDFs through the browser-based editing workflow.",
    icon: PenTool,
    color: "#22A765",
    href: "/editor",
  },
];

function ToolCategories() {
  return (
    <section
      id="tool-categories"
      style={{
        width: "100%",
        maxWidth: "1280px",
        padding: "clamp(32px, 5vh, 48px) 24px 0",
        animation: "fadeInUp 0.8s 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          textAlign: "center",
          maxWidth: "720px",
          margin: "0 auto clamp(32px, 5vh, 48px)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(30px, 3.5vw, 34px)",
            fontWeight: 650,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          Explore ZipDrop's Tools
        </h2>
        <p
          style={{
            fontSize: "clamp(15px, 1.6vw, 16px)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}
        >
          Everything you need to share, convert, compress, edit and manage your files.
        </p>
      </div>

      {/* Category Grid */}
      <div className="tools-grid">
        {TOOL_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div className="tool-category-card-new">
              {/* Icon */}
              <div className="tool-category-icon-new" style={{ color: cat.color }}>
                <cat.icon size={26} strokeWidth={2} aria-hidden="true" />
              </div>

              {/* Title */}
              <h3 className="tool-category-title-new">{cat.title}</h3>

              {/* Description */}
              <p className="tool-category-desc-new">{cat.desc}</p>

              {/* Arrow at bottom-right */}
              <div className="tool-category-arrow-new">
                <ChevronRight size={20} strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── PAGE ───────────────────────────────── */

export default function Home() {
  return (
    <>
      {/* Background layers */}
      <ParticleBackground />

      <Navbar />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "clamp(16px, 2vh, 24px)",
          paddingBottom: "clamp(40px, 6vh, 64px)",
          paddingLeft: "24px",
          paddingRight: "24px",
          gap: "clamp(24px, 3.5vh, 48px)",
        }}
      >
        {/* ── HERO SECTION ── */}
        <Hero />

        {/* ── SHARE & RECEIVE PANELS ── */}
        <ShareReceivePanels />

        {/* ── HOW IT WORKS ── */}
        <HowItWorks />

        {/* ── BENEFITS STRIP ── */}
        <BenefitsStrip />

        {/* ── TOOL CATEGORIES ── */}
        <ToolCategories />
      </main>
    </>
  );
}