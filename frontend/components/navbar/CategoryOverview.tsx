"use client";

import Link from "next/link";
import { ToolCategory } from "@/data/toolCategories";

interface CategoryOverviewProps {
  category: ToolCategory;
}

export function CategoryOverview({ category }: CategoryOverviewProps) {
  const totalTools = category.groups.reduce((sum, group) => sum + group.tools.length, 0);
  const availableTools = category.groups.reduce(
    (sum, group) => sum + group.tools.filter((t) => t.available).length,
    0
  );

  return (
    <aside
      className="mega-menu-category-overview"
      style={{
        width: "22%",
        minWidth: "240px",
        maxWidth: "280px",
        padding: "24px",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-main)",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: "14px",
            background: category.iconBg,
            color: category.iconColor,
            marginBottom: "16px",
          }}
        >
          <category.icon size={28} strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.2 }}>
          {category.name}
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
          {category.description}
        </p>
      </div>

      <div style={{ marginBottom: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Tools
          </span>
          <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {availableTools} / {totalTools}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {category.groups.map((group) => {
            const groupAvailable = group.tools.filter((t) => t.available).length;
            const groupTotal = group.tools.length;
            return (
              <div
                key={group.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  transition: "all 0.18s ease",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {group.title}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {groupAvailable} / {groupTotal}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Link
        href={category.viewAllHref}
        style={{
          marginTop: "auto",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "12px 20px",
          borderRadius: "10px",
          background: "var(--primary-teal)",
          color: "white",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
          transition: "all 0.18s ease",
          boxShadow: "0 2px 8px rgba(7,140,145,0.2)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#05787d";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(7,140,145,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--primary-teal)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(7,140,145,0.2)";
        }}
      >
        View All {category.name}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    </aside>
  );
}