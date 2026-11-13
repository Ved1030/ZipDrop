"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowDownToLine, Code2, Gauge, Laptop, Lock, ShieldCheck, Upload, FileText, Image, Table, Settings, ChevronRight } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", sectionId: "home" },
  { href: "/#tools", label: "Share Files", sectionId: "tools" },
  { href: "/#tools", label: "Share Text", sectionId: "tools" },
  { href: "/conversion", label: "Tools", sectionId: null },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    const element = document.getElementById("tools");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
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
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "16px 24px",
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
            padding: "8px",
            borderRadius: "8px",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--teal-light)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "var(--teal-light)",
              border: "1px solid rgba(7,140,145,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(7,140,145,0.10)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#078C91" strokeWidth="1.8">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91A16 16 0 0015.1 17.9l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            ZipDrop
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {NAV_LINKS.map((link, index) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.sectionId || "")}
              style={{
                textDecoration: "none",
                color: link.href === "/conversion" ? "var(--primary-teal)" : "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: link.href === "/conversion" ? 600 : 500,
                padding: "8px 12px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (link.href !== "/conversion") {
                  e.currentTarget.style.color = "var(--primary-teal)";
                  e.currentTarget.style.backgroundColor = "var(--teal-light)";
                }
              }}
              onMouseLeave={(e) => {
                if (link.href !== "/conversion") {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {link.label}
            </Link>
          ))}
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
            <span style={{ position: "relative", overflow: "hidden" }}>
              Start Sharing
            </span>
            <ChevronRight size={16} />
          </Link>
        </div>

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
      </nav>

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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.sectionId || "")}
                style={{
                  textDecoration: "none",
                  color: link.href === "/conversion" ? "var(--primary-teal)" : "var(--text-primary)",
                  fontSize: "16px",
                  fontWeight: link.href === "/conversion" ? 600 : 500,
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
                  if (link.href !== "/conversion") {
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
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
              Start Sharing
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}