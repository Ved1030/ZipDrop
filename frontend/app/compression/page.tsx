"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Image,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Archive,
} from "lucide-react";
import Navbar from "../../components/Navbar";

const COMPRESSION_CATEGORIES = [
  {
    id: "pdf-compression",
    title: "PDF Compression",
    description: "Reduce PDF file size while preserving quality",
    icon: FileText,
    color: "var(--secondary-blue)",
    bg: "var(--blue-light)",
    tools: [
      { id: "pdf", name: "Compress PDF", description: "Reduce PDF size with 3 compression levels", from: "PDF", to: "PDF", modes: ["Low", "Recommended", "High"], available: true },
    ],
  },
  {
    id: "image-compression",
    title: "Image Compression",
    description: "Compress JPG, PNG, and WEBP images",
    icon: Image,
    color: "var(--purple-highlight)",
    bg: "var(--purple-light)",
    tools: [
      { id: "jpg", name: "Compress JPG", description: "Adjustable quality with progressive option", from: "JPG", to: "JPG", modes: ["High", "Balanced", "Smaller", "Custom"], available: true },
      { id: "png", name: "Compress PNG", description: "Lossless or optimized compression", from: "PNG", to: "PNG", modes: ["Lossless", "Optimized"], available: true },
      { id: "webp", name: "Compress WEBP", description: "Lossy and lossless modes", from: "WEBP", to: "WEBP", modes: ["Lossy", "Lossless"], available: true },
    ],
  },
  {
    id: "bulk-compression",
    title: "Bulk Compression",
    description: "Compress multiple images at once",
    icon: Download,
    color: "var(--green-highlight)",
    bg: "var(--green-light)",
    tools: [
      { id: "bulk-images", name: "Bulk Image Compressor", description: "Multiple images → ZIP archive", from: "Images", to: "ZIP", modes: ["Mixed formats"], available: true },
    ],
  },
  {
    id: "document-compression",
    title: "Document Compression",
    description: "Compress Word, PowerPoint and Excel documents",
    icon: FileText,
    color: "var(--orange-highlight)",
    bg: "var(--orange-light)",
    tools: [
      { id: "compress-word", name: "Compress Word", description: "Reduce DOCX file size", from: "DOCX", to: "DOCX", available: false, comingSoon: true },
      { id: "compress-ppt", name: "Compress PowerPoint", description: "Reduce PPTX file size", from: "PPTX", to: "PPTX", available: false, comingSoon: true },
      { id: "compress-excel", name: "Compress Excel", description: "Reduce XLSX file size", from: "XLSX", to: "XLSX", available: false, comingSoon: true },
    ],
  },
  {
    id: "zip-archives",
    title: "ZIP and Archives",
    description: "Create and extract compressed archives",
    icon: Archive,
    color: "var(--yellow-highlight)",
    bg: "var(--yellow-light)",
    tools: [
      { id: "create-zip", name: "Create ZIP", description: "Create ZIP archives from files", from: "Files", to: "ZIP", available: false, comingSoon: true },
      { id: "extract-zip", name: "Extract ZIP", description: "Extract files from ZIP archives", from: "ZIP", to: "Files", available: false, comingSoon: true },
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

interface CompressionTool {
  id: string;
  name: string;
  description: string;
  from: string;
  to: string;
  modes?: string[];
  available?: boolean;
  comingSoon?: boolean;
}

function ToolCard({ tool, categoryColor, onClick }: { 
  tool: CompressionTool;
  categoryColor: string;
  onClick: () => void;
}) {
  const isAvailable = tool.available !== false;
  const isComingSoon = tool.comingSoon === true;
  
  return (
    <button
      onClick={isAvailable ? onClick : undefined}
      style={{
        width: "100%",
        padding: "20px",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        background: isAvailable ? "var(--bg-card)" : "var(--editor-workspace)",
        cursor: isAvailable ? "pointer" : "not-allowed",
        textAlign: "left",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        opacity: isAvailable ? 1 : 0.5,
      }}
      onMouseEnter={(e) => {
        if (isAvailable) {
          e.currentTarget.style.borderColor = categoryColor;
          e.currentTarget.style.boxShadow = `0 4px 16px ${categoryColor}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (isAvailable) {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }
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
            color: isAvailable ? "var(--text-primary)" : "var(--text-muted)",
          }}>
            <span style={{ color: categoryColor }}>.{tool.from}</span>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
              <line x1={5} y1={12} x2={19} y2={12}></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            <span style={{ color: categoryColor }}>.{tool.to}</span>
          </div>
        </div>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: categoryColor, flexShrink: 0 }}>
          <line x1={5} y1={12} x2={19} y2={12}></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </div>
      <div>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: isAvailable ? "var(--text-primary)" : "var(--text-muted)", margin: 0 }}>
          {tool.name}
        </h3>
        <p style={{ fontSize: "12.5px", color: isAvailable ? "var(--text-secondary)" : "var(--text-muted)", marginTop: "4px", lineHeight: 1.5 }}>
          {tool.description}
        </p>
      </div>
      {tool.modes && (
        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
          {tool.modes.map((mode) => (
            <span key={mode} style={{
              fontSize: "10.5px",
              fontWeight: 500,
              padding: "3px 8px",
              borderRadius: "6px",
              background: isAvailable ? "var(--teal-light)" : "var(--editor-workspace)",
              color: isAvailable ? "var(--primary-teal)" : "var(--text-muted)",
              border: isAvailable ? "1px solid rgba(7,140,145,0.20)" : "1px solid var(--border)",
            }}>
              {mode}
            </span>
          ))}
        </div>
      )}
      {isComingSoon && (
        <span style={{ 
          fontSize: "10px", 
          fontWeight: 500, 
          padding: "2px 8px", 
          borderRadius: "4px", 
          background: "var(--editor-workspace)", 
          color: "var(--text-muted)",
          border: "1px solid var(--border)",
          alignSelf: "flex-start",
          marginTop: "4px",
        }}>
          Coming Soon
        </span>
      )}
    </button>
  );
}

export default function CompressionToolsPage() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    COMPRESSION_CATEGORIES.map(c => c.id)
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
            Compression Tools — Phase 1 Live
          </div>
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}>
            Compress Files <span style={{ color: "var(--primary-teal)" }}>Easily</span>
          </h1>
          <p style={{
            fontSize: "clamp(15px, 1.6vw, 18px)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
          }}>
            Reduce the size of PDFs, images and documents while keeping quality as high as possible.
          </p>
        </section>

        {/* Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {COMPRESSION_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const activeTools = category.tools.length;

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
                        {activeTools} tools
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
                            window.location.href = `/compression/${tool.id}`;
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
            Compression Features
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
                  Real Compression
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                  Actual file size reduction — no fake percentages
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
                <Settings size={20} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  Multiple Levels
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                  Choose quality vs size trade-off per format
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "var(--green-light)",
                border: "1px solid rgba(37,166,83,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--green-highlight)",
                flexShrink: 0,
              }}>
                <Download size={20} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  Bulk Processing
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                  Compress 50 images at once, download as ZIP
                </p>
              </div>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            Phase 1 includes: PDF Compression (3 levels), JPG Compression (quality presets), PNG Compression (lossless/optimized), 
            WEBP Compression (lossy/lossless), and Bulk Image Compressor (mixed formats → ZIP).
          </p>
        </div>
      </div>
    </div>
    </>
  );
}