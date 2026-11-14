"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, Code2, Gauge, Laptop, Lock, ShieldCheck, Upload, FileText, Image, Table, Settings, ChevronRight, Archive, Type, QrCode, PenTool, FileVideo, FileAudio, FileArchive } from "lucide-react";
import UploadCard from "../components/UploadCard";
import ReceiveCard from "../components/ReceiveCard";
import Navbar from "../components/Navbar";

/* ─── Background Waves ───────────────────── */

function ParticleBackground() {
  return (
    <div className="bg-waves" aria-hidden="true">
      <span className="wave wave-top" />
      <span className="wave wave-bottom" />
    </div>
  );
}

/* ─── Hero Background Shapes ─────────────── */

function HeroShapes() {
  return (
    <div className="hero-shapes" aria-hidden="true">
      <span className="shape-left" />
      <span className="shape-right" />
    </div>
  );
}

/* ─── HERO SECTION ──────────────────────── */

function Hero() {
  return (
    <section id="home" style={{
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
    }}>
      {/* Background shapes */}
      <HeroShapes />

      {/* Top badge */}
      <div className="badge hero-badge" style={{ fontSize: "11px", padding: "5px 14px" }}>
        <span className="badge-dot" />
        Free · No Sign-up · 4-digit code
      </div>

      {/* Main heading - H1 */}
      <h1 style={{
        fontSize: "clamp(48px, min(7vw, 10vh), 96px)",
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        color: "var(--text-primary)",
        margin: 0,
      }}>
        Share, Convert and Edit Files Online Without Signing Up
      </h1>

      {/* Supporting heading */}
      <p style={{
        fontSize: "clamp(18px, 2.2vw, 24px)",
        color: "var(--text-secondary)",
        lineHeight: 1.4,
        maxWidth: "640px",
        margin: 0,
        fontWeight: 400,
      }}>
        ZipDrop lets you share files between devices, edit documents in the browser, and convert files across formats — all without an account.
      </p>

      {/* Subheading */}
      <p style={{
        fontSize: "clamp(14px, 1.5vw, 16px)",
        color: "var(--text-muted)",
        lineHeight: 1.6,
        maxWidth: "560px",
        margin: 0,
      }}>
        Fast, secure and works on all your devices.
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
    <section id="share-receive" style={{
      width: "100%",
      maxWidth: "1280px",
      display: "flex",
      gap: "24px",
      flexWrap: "wrap",
      justifyContent: "center",
      padding: "0 24px",
      animation: "fadeInUp 0.6s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both",
    }}>
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
    <section id="how-it-works" className="hiw" style={{ animation: "fadeInUp 0.8s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
      <h2 style={{
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--text-muted)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}>
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

/* ─── SECTION A: FILE AND TEXT SHARING ──────────────────────── */

function FileSharingSection() {
  return (
    <section id="file-sharing" style={{
      width: "100%",
      maxWidth: "1280px",
      padding: "clamp(32px, 5vh, 48px) 24px",
      animation: "fadeInUp 0.8s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: "720px",
        margin: "0 auto clamp(32px, 5vh, 48px)",
      }}>
        <h2 style={{
          fontSize: "clamp(28px, 3.5vw, 34px)",
          fontWeight: 650,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: "12px",
        }}>
          Share Files and Text Between Devices
        </h2>
        <p style={{
          fontSize: "clamp(15px, 1.6vw, 16px)",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
        }}>
          Transfer files, images, videos, ZIP archives, and text using a simple 4-digit code — no account required.
        </p>
      </div>

      <div className="tools-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <div className="tool-category-card-new">
          <div className="tool-category-icon-new" style={{ color: "#078C91" }}>
            <Upload size={26} strokeWidth={2} aria-hidden="true" />
          </div>
          <h3 className="tool-category-title-new">File Sharing</h3>
          <p className="tool-category-desc-new">
            Upload files and generate a 4-digit code. Share the code with another device to receive the files. Supports images, videos, ZIP archives, documents, and other formats.
          </p>
          <Link href="/#share-receive" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--primary-teal)", textDecoration: "none" }}>
            Try File Sharing <ChevronRight size={14} />
          </Link>
        </div>

        <div className="tool-category-card-new">
          <div className="tool-category-icon-new" style={{ color: "#078C91" }}>
            <Type size={26} strokeWidth={2} aria-hidden="true" />
          </div>
          <h3 className="tool-category-title-new">Text Sharing</h3>
          <p className="tool-category-desc-new">
            Paste any text, code snippet, or notes and share them instantly with a 4-digit code. Works across phones, tablets, and computers.
          </p>
          <Link href="/#share-receive" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--primary-teal)", textDecoration: "none" }}>
            Try Text Sharing <ChevronRight size={14} />
          </Link>
        </div>

        <div className="tool-category-card-new">
          <div className="tool-category-icon-new" style={{ color: "#078C91" }}>
            <FileVideo size={26} strokeWidth={2} aria-hidden="true" />
          </div>
          <h3 className="tool-category-title-new">Media & Archives</h3>
          <p className="tool-category-desc-new">
            Share images, videos, and ZIP files between devices. No format restrictions — if you can upload it, you can share it.
          </p>
          <Link href="/#share-receive" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--primary-teal)", textDecoration: "none" }}>
            Share Media <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div style={{ marginTop: "32px", padding: "20px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "12px", maxWidth: "800px", marginLeft: "auto", marginRight: "auto" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
          How File Sharing Works
        </h3>
        <ul style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: "20px" }}>
          <li>Upload up to 10 files at once from the Share panel.</li>
          <li>ZipDrop generates a unique 4-digit code for your transfer.</li>
          <li>Send the code to the recipient via any channel (message, email, voice).</li>
          <li>Recipient enters the code on ZipDrop and downloads the files.</li>
          <li>Text sharing works the same way — paste text, get a code, share it.</li>
          <li>No account, no login, no installation required on either device.</li>
        </ul>
      </div>
    </section>
  );
}

/* ─── SECTION B: OPEN AND EDIT DOCUMENTS ONLINE ──────────────────────── */

function DocumentEditingSection() {
  return (
    <section id="document-editing" style={{
      width: "100%",
      maxWidth: "1280px",
      padding: "clamp(32px, 5vh, 48px) 24px",
      animation: "fadeInUp 0.8s 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
      background: "var(--bg-card)",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      marginTop: "clamp(24px, 3.5vh, 48px)",
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: "720px",
        margin: "0 auto clamp(32px, 5vh, 48px)",
      }}>
        <h2 style={{
          fontSize: "clamp(28px, 3.5vw, 34px)",
          fontWeight: 650,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: "12px",
        }}>
          Open and Edit Documents in the Browser
        </h2>
        <p style={{
          fontSize: "clamp(15px, 1.6vw, 16px)",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
        }}>
          View and edit supported documents directly on ZipDrop. Download the edited file or share it with a new code.
        </p>
      </div>

      <div className="tools-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <div className="tool-category-card-new">
          <div className="tool-category-icon-new" style={{ color: "#25A653" }}>
            <PenTool size={26} strokeWidth={2} aria-hidden="true" />
          </div>
          <h3 className="tool-category-title-new">Supported Editable Formats</h3>
          <p className="tool-category-desc-new">
            DOCX (Word), TXT, Markdown, and HTML files open directly in the editor. PDF files are converted to editable Word documents first.
          </p>
          <Link href="/editor" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--primary-teal)", textDecoration: "none" }}>
            Open Editor <ChevronRight size={14} />
          </Link>
        </div>

        <div className="tool-category-card-new">
          <div className="tool-category-icon-new" style={{ color: "#25A653" }}>
            <FileText size={26} strokeWidth={2} aria-hidden="true" />
          </div>
          <h3 className="tool-category-title-new">Edit & Save</h3>
          <p className="tool-category-desc-new">
            Modify text, formatting, and structure in the browser-based editor. Download the edited DOCX or share it instantly with a new 4-digit code.
          </p>
          <Link href="/editor" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--primary-teal)", textDecoration: "none" }}>
            Edit a Document <ChevronRight size={14} />
          </Link>
        </div>

        <div className="tool-category-card-new">
          <div className="tool-category-icon-new" style={{ color: "#25A653" }}>
            <FileVideo size={26} strokeWidth={2} aria-hidden="true" />
          </div>
          <h3 className="tool-category-title-new">Preview Only</h3>
          <p className="tool-category-desc-new">
            Images, videos, ZIP archives, spreadsheets, and presentations can be previewed or downloaded but not edited in the browser editor.
          </p>
          <Link href="/conversion?category=document-tools" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--primary-teal)", textDecoration: "none" }}>
            View Document Tools <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div style={{ marginTop: "32px", padding: "20px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", borderRadius: "12px", maxWidth: "800px", marginLeft: "auto", marginRight: "auto" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--primary-teal)", marginBottom: "12px" }}>
          Editing Workflow
        </h3>
        <ul style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: "20px" }}>
          <li>Open a shared document or upload one directly to the <Link href="/editor" className="zd-blog-link">editor</Link>.</li>
          <li>PDF files are converted to DOCX for editing (layout fidelity varies).</li>
          <li>Edit content, formatting, and structure using the toolbar.</li>
          <li>Download the edited DOCX file to your device.</li>
          <li>Share the edited copy with a new 4-digit code via the <code>Share Edited</code> button.</li>
          <li>No account needed at any step.</li>
        </ul>
      </div>
    </section>
  );
}

/* ─── SECTION C: ONLINE FILE CONVERSION TOOLS ──────────────────────── */

function ConversionToolsSection() {
  return (
    <section id="conversion-tools" style={{
      width: "100%",
      maxWidth: "1280px",
      padding: "clamp(32px, 5vh, 48px) 24px",
      animation: "fadeInUp 0.8s 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: "720px",
        margin: "0 auto clamp(32px, 5vh, 48px)",
      }}>
        <h2 style={{
          fontSize: "clamp(28px, 3.5vw, 34px)",
          fontWeight: 650,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: "12px",
        }}>
          Online File Conversion Tools
        </h2>
        <p style={{
          fontSize: "clamp(15px, 1.6vw, 16px)",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
        }}>
          Convert files across PDF, images, Office documents, and more. All tools run in the browser or on our servers — no software to install.
        </p>
      </div>

      <div className="tools-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <Link href="/conversion?category=pdf-tools" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="tool-category-card-new">
            <div className="tool-category-icon-new" style={{ color: "#168DBB" }}>
              <FileText size={26} strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="tool-category-title-new">PDF Tools</h3>
            <p className="tool-category-desc-new">
              Convert PDF to Word, Excel, PowerPoint, JPG, PNG, Text, HTML, PDF/A. Convert Word, Excel, PowerPoint to PDF.
            </p>
          </div>
        </Link>

        <Link href="/conversion?category=image-tools" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="tool-category-card-new">
            <div className="tool-category-icon-new" style={{ color: "#873BC5" }}>
              <Image size={26} strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="tool-category-title-new">Image Tools</h3>
            <p className="tool-category-desc-new">
              Convert between JPG, PNG, WEBP, SVG. Combine multiple images into a single PDF.
            </p>
          </div>
        </Link>

        <Link href="/conversion?category=document-tools" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="tool-category-card-new">
            <div className="tool-category-icon-new" style={{ color: "#25A653" }}>
              <Type size={26} strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="tool-category-title-new">Document & Office</h3>
            <p className="tool-category-desc-new">
              Word to PDF, Text, HTML. Excel to PDF, CSV. PowerPoint to PDF. RTF to Word. Text/HTML/CSV to PDF/Excel.
            </p>
          </div>
        </Link>

        <Link href="/compression" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="tool-category-card-new">
            <div className="tool-category-icon-new" style={{ color: "#647180" }}>
              <Archive size={26} strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="tool-category-title-new">Compression Tools</h3>
            <p className="tool-category-desc-new">
              Compress PDF, JPG, PNG, WEBP with quality presets. Bulk compress up to 50 images into a ZIP.
            </p>
          </div>
        </Link>

        <Link href="/conversion?category=utility-tools" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="tool-category-card-new">
            <div className="tool-category-icon-new" style={{ color: "#873BC5" }}>
              <QrCode size={26} strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="tool-category-title-new">Utility Tools</h3>
            <p className="tool-category-desc-new">
              QR code generator, file hash generator, Base64 encode/decode, URL encode/decode (planned/available).
            </p>
          </div>
        </Link>
      </div>

      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <Link href="/conversion" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "14px 28px",
          fontSize: "15px",
          fontWeight: 600,
          background: "var(--primary-teal)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          textDecoration: "none",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#05787d";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--primary-teal)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        >
          View All Conversion Tools <ChevronRight size={18} />
        </Link>
      </div>
    </section>
  );
}

/* ─── SECTION D: WHY USE ZIPDROP? ──────────────────────── */

function WhyZipDropSection() {
  const BENEFITS = [
    { title: "No Sign-up Required", desc: "Use all features immediately without creating an account.", icon: Lock },
    { title: "Browser-Based Workflow", desc: "Works on any device with a modern browser — phone, tablet, or desktop.", icon: Laptop },
    { title: "Cross-Device File Sharing", desc: "Transfer files between any devices using a simple 4-digit code.", icon: Gauge },
    { title: "Document Editing", desc: "Open and edit Word documents, text files, and PDFs (converted) in the browser.", icon: PenTool },
    { title: "Online Conversion Suite", desc: "Convert PDFs, images, Office documents, and more in one place.", icon: Settings },
    { title: "Simple Code-Based Sharing", desc: "Share anything with a 4-digit code — no links, emails, or apps needed.", icon: Code2 },
  ];

  return (
    <section id="why-zipdrop" style={{
      width: "100%",
      maxWidth: "1280px",
      padding: "clamp(32px, 5vh, 48px) 24px",
      animation: "fadeInUp 0.8s 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
      background: "var(--bg-card)",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      marginTop: "clamp(24px, 3.5vh, 48px)",
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: "720px",
        margin: "0 auto clamp(32px, 5vh, 48px)",
      }}>
        <h2 style={{
          fontSize: "clamp(28px, 3.5vw, 34px)",
          fontWeight: 650,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: "12px",
        }}>
          Why Use ZipDrop?
        </h2>
        <p style={{
          fontSize: "clamp(15px, 1.6vw, 16px)",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
        }}>
          ZipDrop combines file sharing, document editing, and format conversion in a single browser-based tool with no account required.
        </p>
      </div>

      <div className="glass-card benefits-strip" style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
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

/* ─── TOOL CATEGORIES (Enhanced with links) ───────── */

const TOOL_CATEGORIES = [
  {
    id: "pdf-tools",
    title: "PDF Tools",
    desc: "Convert PDF to Word, Excel, PowerPoint, JPG, PNG, Text, HTML, PDF/A. Convert Office to PDF.",
    icon: FileText,
    color: "#168DBB",
    href: "/conversion?category=pdf-tools",
  },
  {
    id: "document-tools",
    title: "Document Tools",
    desc: "Word to PDF, Text, HTML. Excel to PDF, CSV. PowerPoint to PDF. RTF to Word. Text/HTML to PDF.",
    icon: Type,
    color: "#25A653",
    href: "/conversion?category=document-tools",
  },
  {
    id: "image-tools",
    title: "Image Tools",
    desc: "Convert between JPG, PNG, WEBP, SVG. Combine multiple images into PDF.",
    icon: Image,
    color: "#873BC5",
    href: "/conversion?category=image-tools",
  },
  {
    id: "compression-tools",
    title: "Compression Tools",
    desc: "Compress PDF, JPG, PNG, WEBP with quality presets. Bulk compress images to ZIP.",
    icon: Archive,
    color: "#647180",
    href: "/compression",
  },
  {
    id: "conversion-tools",
    title: "All Conversion Tools",
    desc: "Browse all 30+ conversion tools across PDF, Office, images, and utilities.",
    icon: Settings,
    color: "#078C91",
    href: "/conversion",
  },
  {
    id: "online-editor",
    title: "Online Editor",
    desc: "Edit Word documents and text files directly in your browser. Share edited copies.",
    icon: PenTool,
    color: "#25A653",
    href: "/editor",
  },
];

function ToolCategories() {
  return (
    <section id="tool-categories" style={{
      width: "100%",
      maxWidth: "1280px",
      padding: "clamp(32px, 5vh, 48px) 24px 0",
      animation: "fadeInUp 0.8s 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
    }}>
      {/* Section Header */}
      <div style={{
        textAlign: "center",
        maxWidth: "720px",
        margin: "0 auto clamp(32px, 5vh, 48px)",
      }}>
        <h2 style={{
          fontSize: "clamp(30px, 3.5vw, 34px)",
          fontWeight: 650,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: "12px",
        }}>
          Explore ZipDrop's Tools
        </h2>
        <p style={{
          fontSize: "clamp(15px, 1.6vw, 16px)",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
        }}>
          A complete collection of tools to share, convert, compress, edit, and manage your files.
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

      {/* Links to important pages */}
      <div style={{ marginTop: "48px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
        <Link href="/online-clipboard" className="glass-card" style={{ padding: "16px 24px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "10px", borderRadius: "12px", transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary-teal)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(7,140,145,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <QrCode size={20} strokeWidth={2} style={{ color: "var(--primary-teal)" }} />
          <span style={{ fontWeight: 500 }}>Online Clipboard</span>
        </Link>
        <Link href="/blog" className="glass-card" style={{ padding: "16px 24px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "10px", borderRadius: "12px", transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary-teal)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(7,140,145,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <FileText size={20} strokeWidth={2} style={{ color: "var(--primary-teal)" }} />
          <span style={{ fontWeight: 500 }}>Blog</span>
        </Link>
        <Link href="/about" className="glass-card" style={{ padding: "16px 24px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "10px", borderRadius: "12px", transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary-teal)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(7,140,145,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <ShieldCheck size={20} strokeWidth={2} style={{ color: "var(--primary-teal)" }} />
          <span style={{ fontWeight: 500 }}>About ZipDrop</span>
        </Link>
      </div>
    </section>
  );
}

/* ─── STATS STRIP (Optional - keeping for continuity) ───────── */

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
    return () => { cancelled = true; };
  }, []);

  if (!stats) return null;

  const items = [
    { label: "Files shared", value: stats.files.toLocaleString("en-US") },
    { label: "Transfers", value: stats.transfers.toLocaleString("en-US") },
  ];

  return (
    <section id="stats" style={{
      width: "100%",
      maxWidth: "1280px",
      padding: "0 24px",
      animation: "fadeInUp 0.8s 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
    }}>
      <div style={{
        display: "flex",
        gap: "32px",
        justifyContent: "center",
        flexWrap: "wrap",
        margin: "0 auto",
        padding: "24px 0",
      }}>
        {items.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--primary-teal)", fontFamily: "var(--font-mono)" }}>
              {s.value}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {s.label}
            </p>
          </div>
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

        {/* ── SECTION A: FILE AND TEXT SHARING ── */}
        <FileSharingSection />

        {/* ── SECTION B: DOCUMENT EDITING ── */}
        <DocumentEditingSection />

        {/* ── SECTION C: CONVERSION TOOLS ── */}
        <ConversionToolsSection />

        {/* ── SECTION D: WHY USE ZIPDROP? ── */}
        <WhyZipDropSection />

        {/* ── TOOL CATEGORIES ── */}
        <ToolCategories />

        {/* ── STATS (Optional) ── */}
        <StatsStrip />
      </main>
    </>
  );
}