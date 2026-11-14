"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, HelpCircle, ChevronRight } from "lucide-react";
import ZipDropLogo from "./brand/ZipDropLogo";
import { MegaMenu, ToolsDropdownButton } from "./navbar/MegaMenu";

const NAV_LINKS = [
  { href: "/", label: "Home", sectionId: "home" },
  { href: "/#share-receive", label: "Share", sectionId: "share-receive" },
  { href: "/editor", label: "Editor", sectionId: null },
  { href: "/about", label: "About", sectionId: null },
];

function HelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string | null) => {
    if (sectionId) {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setIsMobileMenuOpen(false);
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  const handleStartSharing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById("share-receive");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: isScrolled ? "1px solid var(--border)" : "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxShadow: isScrolled ? "0 4px 20px rgba(0, 0, 0, 0.04)" : "none",
      }}
    >
      <nav
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            const element = document.getElementById("home");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            } else {
              window.location.href = "/";
            }
          }}
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px",
            borderRadius: "8px",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--teal-light)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <ZipDropLogo size="small" />
        </Link>

        {/* Desktop Navigation */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "home")}
            style={{
              textDecoration: "none",
              color: "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary-teal)";
              e.currentTarget.style.backgroundColor = "var(--teal-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Home
          </Link>

          <div style={{ position: "relative" }}>
            <ToolsDropdownButton
              ref={toolsButtonRef}
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              isOpen={toolsDropdownOpen}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--primary-teal)";
                e.currentTarget.style.backgroundColor = "var(--teal-light)";
              }}
              onMouseLeave={(e) => {
                if (!toolsDropdownOpen) {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            />
          </div>

          <Link
            href="/#share-receive"
            onClick={(e) => handleNavClick(e, "share-receive")}
            style={{
              textDecoration: "none",
              color: "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary-teal)";
              e.currentTarget.style.backgroundColor = "var(--teal-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Share
          </Link>

          <Link
            href="/editor"
            style={{
              textDecoration: "none",
              color: "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary-teal)";
              e.currentTarget.style.backgroundColor = "var(--teal-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Editor
          </Link>

          <Link
            href="/about"
            style={{
              textDecoration: "none",
              color: "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary-teal)";
              e.currentTarget.style.backgroundColor = "var(--teal-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            About
          </Link>

          <Link
            href="/"
            onClick={handleStartSharing}
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--primary-teal)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              textDecoration: "none",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 14px rgba(7,140,145,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#05787d";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(7,140,145,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-teal)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(7,140,145,0.3)";
            }}
          >
            <span style={{ position: "relative", overflow: "hidden" }}>Get Started</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Right side: Help + Mobile Menu Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => window.open("mailto:mehtaved12@gmail.com?subject=ZipDrop%20Help", "_blank")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--teal-light)";
              e.currentTarget.style.borderColor = "rgba(7,140,145,0.28)";
              e.currentTarget.style.color = "var(--primary-teal)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            aria-label="Help & Support"
          >
            <HelpIcon />
          </button>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: "10px",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--editor-workspace)";
              e.currentTarget.style.borderColor = "var(--primary-teal)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
          </button>
        </div>
      </nav>

      {/* Mega Menu - positioned relative to navbar for proper stacking */}
      {toolsDropdownOpen && (
        <MegaMenu isOpen={toolsDropdownOpen} onClose={() => setToolsDropdownOpen(false)} triggerRef={toolsButtonRef} />
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "280px",
            maxWidth: "85vw",
            background: "var(--bg-main)",
            borderLeft: "1px solid var(--border)",
            boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.1)",
            zIndex: 99,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            animation: "slideInRight 0.3s ease forwards",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid var(--border)", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Navigation
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--editor-workspace)";
                e.currentTarget.style.borderColor = "var(--primary-teal)";
                e.currentTarget.style.color = "var(--primary-teal)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              aria-label="Close menu"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
            <Link
              href="/"
              onClick={(e) => handleNavClick(e, "home")}
              style={{
                textDecoration: "none",
                color: "var(--text-primary)",
                fontSize: "16px",
                fontWeight: 500,
                padding: "16px 0",
                borderRadius: "10px",
                borderBottom: "1px solid var(--border)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--teal-light)";
                e.currentTarget.style.color = "var(--primary-teal)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
            >
              Home
            </Link>
            <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "12px" }}>
                Tools
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {[
                  { label: "Conversion Tools", href: "/conversion" },
                  { label: "PDF Tools", href: "/conversion?category=pdf-tools" },
                  { label: "Document Tools", href: "/conversion?category=document-tools" },
                  { label: "Image Tools", href: "/conversion?category=image-tools" },
                  { label: "Compression Tools", href: "/conversion?category=compression-tools" },
                  { label: "Text Tools", href: "/conversion?category=text-tools" },
                  { label: "Utility Tools", href: "/conversion?category=utility-tools" },
                  { label: "Online Editor", href: "/editor" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      textDecoration: "none",
                      color: "var(--text-primary)",
                      fontSize: "15px",
                      fontWeight: 500,
                      padding: "12px 0",
                      borderRadius: "8px",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--teal-light)";
                      e.currentTarget.style.color = "var(--primary-teal)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/#share-receive"
              onClick={(e) => handleNavClick(e, "share-receive")}
              style={{
                textDecoration: "none",
                color: "var(--text-primary)",
                fontSize: "16px",
                fontWeight: 500,
                padding: "16px 0",
                borderRadius: "10px",
                borderBottom: "1px solid var(--border)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--teal-light)";
                e.currentTarget.style.color = "var(--primary-teal)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
            >
              Share
            </Link>
            <Link
              href="/editor"
              style={{
                textDecoration: "none",
                color: "var(--text-primary)",
                fontSize: "16px",
                fontWeight: 500,
                padding: "16px 0",
                borderRadius: "10px",
                borderBottom: "1px solid var(--border)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--teal-light)";
                e.currentTarget.style.color = "var(--primary-teal)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
            >
              Editor
            </Link>
            <Link
              href="/about"
              style={{
                textDecoration: "none",
                color: "var(--text-primary)",
                fontSize: "16px",
                fontWeight: 500,
                padding: "16px 0",
                borderRadius: "10px",
                borderBottom: "1px solid var(--border)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--teal-light)";
                e.currentTarget.style.color = "var(--primary-teal)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
            >
              About
            </Link>
          </nav>

          <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border)", marginTop: "auto" }}>
            <Link
              href="/"
              onClick={handleStartSharing}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "15px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "var(--primary-teal)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                textDecoration: "none",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 14px rgba(7,140,145,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#05787d";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(7,140,145,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-teal)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(7,140,145,0.3)";
              }}
            >
              Get Started
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}