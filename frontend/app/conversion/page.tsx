"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Image,
  Table,
  Presentation,
  FileSpreadsheet,
  ArrowRight,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react";
import Navbar from "../../components/Navbar";

const CONVERSION_CATEGORIES = [
  {
    id: "pdf-conversions",
    title: "PDF Conversions",
    description: "Convert PDF documents to various formats",
    icon: FileText,
    color: "var(--secondary-blue)",
    bg: "var(--blue-light)",
    tools: [
      { id: "pdf-to-word", name: "PDF to Word", description: "Convert PDF to editable DOCX with layout preservation", from: "PDF", to: "DOCX", modes: ["Editable", "Visual Fidelity"] },
      { id: "pdf-to-excel", name: "PDF to Excel", description: "Extract tables from PDF to XLSX spreadsheets", from: "PDF", to: "XLSX", comingSoon: true },
      { id: "pdf-to-ppt", name: "PDF to PowerPoint", description: "Convert PDF pages to editable PPTX slides", from: "PDF", to: "PPTX", comingSoon: true },
      { id: "pdf-to-jpg", name: "PDF to JPG", description: "Rasterize PDF pages to high-quality JPG images", from: "PDF", to: "JPG" },
      { id: "pdf-to-png", name: "PDF to PNG", description: "Rasterize PDF pages to PNG with transparency support", from: "PDF", to: "PNG" },
      { id: "pdf-to-txt", name: "PDF to Text", description: "Extract plain text from PDF documents", from: "PDF", to: "TXT", comingSoon: true },
      { id: "pdf-to-html", name: "PDF to HTML", description: "Convert PDF to structured HTML", from: "PDF", to: "HTML", comingSoon: true },
      { id: "pdf-to-pdfa", name: "PDF to PDF/A", description: "Convert to archival PDF/A standard", from: "PDF", to: "PDF/A", comingSoon: true },
    ],
  },
  {
    id: "office-to-pdf",
    title: "Office to PDF",
    description: "Convert Office documents to PDF with high fidelity",
    icon: FileText,
    color: "var(--primary-teal)",
    bg: "var(--teal-light)",
    tools: [
      { id: "word-to-pdf", name: "Word to PDF", description: "Convert DOCX/DOC to PDF preserving formatting", from: "DOCX", to: "PDF" },
      { id: "excel-to-pdf", name: "Excel to PDF", description: "Convert XLSX/XLS to PDF with sheet fidelity", from: "XLSX", to: "PDF", comingSoon: true },
      { id: "ppt-to-pdf", name: "PowerPoint to PDF", description: "Convert PPTX/PPT to PDF preserving slides", from: "PPTX", to: "PDF", comingSoon: true },
    ],
  },
  {
    id: "office-other",
    title: "Office Document Conversions",
    description: "Convert between Office formats",
    icon: Table,
    color: "var(--green-highlight)",
    bg: "var(--green-light)",
    tools: [
      { id: "word-to-txt", name: "Word to Text", description: "Extract plain text from Word documents", from: "DOCX", to: "TXT", comingSoon: true },
      { id: "word-to-html", name: "Word to HTML", description: "Convert DOCX to clean HTML", from: "DOCX", to: "HTML", comingSoon: true },
      { id: "excel-to-csv", name: "Excel to CSV", description: "Convert spreadsheets to CSV format", from: "XLSX", to: "CSV", comingSoon: true },
    ],
  },
  {
    id: "image-conversions",
    title: "Image Conversions",
    description: "Convert between image formats",
    icon: Image,
    color: "var(--purple-highlight)",
    bg: "var(--purple-light)",
    tools: [
      { id: "jpg-to-png", name: "JPG to PNG", description: "Convert JPG to lossless PNG with transparency", from: "JPG", to: "PNG" },
      { id: "png-to-jpg", name: "PNG to JPG", description: "Convert PNG to compressed JPG", from: "PNG", to: "JPG" },
      { id: "webp-to-jpg", name: "WEBP to JPG", description: "Convert WEBP to widely compatible JPG", from: "WEBP", to: "JPG", comingSoon: true },
      { id: "jpg-to-webp", name: "JPG to WEBP", description: "Convert JPG to modern WEBP format", from: "JPG", to: "WEBP", comingSoon: true },
      { id: "png-to-webp", name: "PNG to WEBP", description: "Convert PNG to WEBP with transparency", from: "PNG", to: "WEBP", comingSoon: true },
      { id: "svg-to-png", name: "SVG to PNG", description: "Rasterize vector SVG to PNG", from: "SVG", to: "PNG", comingSoon: true },
      { id: "images-to-pdf", name: "Images to PDF", description: "Combine multiple images into a single PDF", from: "Images", to: "PDF" },
    ],
  },
  {
    id: "other-conversions",
    title: "Other Conversions",
    description: "Additional format conversions",
    icon: Settings,
    color: "var(--text-secondary)",
    bg: "var(--editor-workspace)",
    tools: [
      { id: "txt-to-pdf", name: "Text to PDF", description: "Convert plain text files to PDF", from: "TXT", to: "PDF", comingSoon: true },
      { id: "html-to-pdf", name: "HTML to PDF", description: "Convert HTML pages to PDF documents", from: "HTML", to: "PDF", comingSoon: true },
      { id: "csv-to-excel", name: "CSV to Excel", description: "Convert CSV data to XLSX spreadsheets", from: "CSV", to: "XLSX", comingSoon: true },
      { id: "rtf-to-docx", name: "RTF to Word", description: "Convert Rich Text Format to DOCX", from: "RTF", to: "DOCX", comingSoon: true },
    ],
  },
];

function CategoryIcon({ icon: Icon, color, bg }: { icon: React.ComponentType<any>; color: string; bg: string }) {
  return (
    <div style={{
      width: 48,
      height: 48,
      borderRadius: 14,
      background: bg,
      border: `1px solid ${color}40`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color,
      flexShrink: 0,
    }}>
      <Icon size={24} strokeWidth={2} aria-hidden="true" />
    </div>
  );
}
 
interface ConversionTool {
  id: string;
  name: string;
  description: string;
  from: string;
  to: string;
  modes?: string[];
  comingSoon?: boolean;
}
 
function ToolCard({ tool, categoryColor, onClick }: { 
  tool: ConversionTool;
  categoryColor: string;
  onClick: () => void;
}) {
  const isComingSoon = tool.comingSoon;
  
  return (
    <button
      onClick={onClick}
      disabled={isComingSoon}
      style={{
        width: "100%",
        padding: "20px",
        borderRadius: "16px",
        border: `1px solid ${isComingSoon ? "var(--border)" : "var(--border)"}`,
        background: isComingSoon ? "var(--bg-card)" : "var(--bg-card)",
        cursor: isComingSoon ? "not-allowed" : "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        opacity: isComingSoon ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isComingSoon) {
          e.currentTarget.style.borderColor = categoryColor;
          e.currentTarget.style.boxShadow = `0 4px 16px ${categoryColor}20`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}>
            <span style={{ color: categoryColor }}>.{tool.from}</span>
            <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
            <span style={{ color: categoryColor }}>.{tool.to}</span>
          </div>
          {isComingSoon && (
            <span style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "99px",
              background: "var(--editor-workspace)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>Coming Soon</span>
          )}
        </div>
        {!isComingSoon && (
          <ArrowRight size={20} style={{ color: categoryColor, flexShrink: 0 }} />
        )}
      </div>
      <div>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
          {tool.name}
        </h3>
        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
          {tool.description}
        </p>
      </div>
      {tool.modes && (
        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
          {tool.modes.map((mode) => (
            <span key={mode} style={{
              fontSize: "10.5px",
              fontWeight: 500,
              padding: "3px 8px",
              borderRadius: "6px",
              background: "var(--teal-light)",
              color: "var(--primary-teal)",
              border: "1px solid rgba(7,140,145,0.20)",
            }}>
              {mode}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export default function ConversionToolsPage() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    CONVERSION_CATEGORIES.map(c => c.id)
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <>
      <Navbar />
      <div style={{ 
        minHeight: "100vh", 
        background: "var(--bg-main)",
        padding: "clamp(24px, 4vh, 48px) 24px",
      }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Hero Section */}
        <section style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto" }}>
          <div className="badge" style={{ 
            fontSize: "11px", 
            padding: "5px 14px", 
            marginBottom: "16px",
            display: "inline-flex",
          }}>
            <span className="badge-dot" />
            Conversion Tools — Phase 1 Live
          </div>
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}>
            Convert Files <span style={{ color: "var(--primary-teal)" }}>Professionally</span>
          </h1>
          <p style={{
            fontSize: "clamp(15px, 1.6vw, 18px)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}>
            High-fidelity file conversion preserving layout, formatting, and visual appearance.
            Powered by industry-standard libraries with editable and visual-fidelity modes.
          </p>
        </section>

        {/* Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {CONVERSION_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const activeTools = category.tools.filter(t => !t.comingSoon).length;
            const totalTools = category.tools.length;

            return (
              <div key={category.id} className="glass-card" style={{ overflow: "hidden" }}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    width: "100%",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <CategoryIcon icon={category.icon} color={category.color} bg={category.bg} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <h2 style={{ 
                        fontSize: "18px", 
                        fontWeight: 700, 
                        color: "var(--text-primary)",
                        margin: 0,
                      }}>
                        {category.title}
                      </h2>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: "99px",
                        background: category.bg,
                        color: category.color,
                        border: `1px solid ${category.color}40`,
                      }}>
                        {activeTools}/{totalTools} tools
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: "13px", 
                      color: "var(--text-secondary)", 
                      marginTop: "4px",
                      marginBottom: 0,
                    }}>
                      {category.description}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}>
                      {activeTools} available
                    </span>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "8px",
                      background: "var(--editor-workspace)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-secondary)",
                      transition: "transform 0.2s ease",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}>
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </button>

                {/* Category Tools Grid */}
                <div style={{ 
                  padding: isExpanded ? "0 24px 24px" : "0 24px",
                  overflow: "hidden",
                  transition: "padding 0.25s ease",
                }}>
                  {isExpanded && (
                    <div 
                      style={{ 
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: "16px",
                        marginTop: "16px",
                        animation: "fadeInUp 0.3s ease forwards",
                      }}
                    >
                      {category.tools.map((tool) => (
                        <ToolCard
                          key={tool.id}
                          tool={tool}
                          categoryColor={category.color}
                          onClick={() => {
                            if (!tool.comingSoon) {
                              window.location.href = `/conversion/${tool.id}`;
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="glass-card" style={{ padding: "24px", textAlign: "center" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            Conversion Quality Modes
          </h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "var(--teal-light)",
                border: "1px solid rgba(7,140,145,0.24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary-teal)",
                flexShrink: 0,
              }}>
                <Check size={20} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  Editable Mode
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                  Reconstructs text, tables, images as editable elements
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "var(--blue-light)",
                border: "1px solid rgba(22,141,187,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--secondary-blue)",
                flexShrink: 0,
              }}>
                <Download size={20} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  Visual Fidelity
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                  Preserves exact page appearance with positioned elements
                </p>
              </div>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            Phase 1 includes: PDF↔Word, PDF→JPG/PNG, Images→PDF. More tools coming in Phase 2.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}