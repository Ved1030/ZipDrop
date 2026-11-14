"use client";

import Link from "next/link";
import { ToolCategory, Tool, ToolGroup } from "@/data/toolCategories";

interface ToolColumnsProps {
  category: ToolCategory;
}

function ToolItem({ tool }: { tool: Tool }) {
  const iconColor = tool.iconColor || "var(--text-muted)";
  if (!tool.available) {
    return (
      <Link
        href={tool.href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          borderRadius: "8px",
          textDecoration: "none",
          color: "var(--text-muted)",
          fontSize: "13px",
          fontWeight: 400,
          cursor: "not-allowed",
          opacity: 0.5,
        }}
        onClick={(e) => e.preventDefault()}
      >
        {tool.icon && (
          <span style={{ display: "inline-flex", width: 16, height: 16, color: iconColor }}>
            <tool.icon size={14} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        <span style={{ flex: 1 }}>{tool.name}</span>
        {tool.comingSoon && (
          <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Coming Soon
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={tool.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        borderRadius: "8px",
        textDecoration: "none",
        color: "var(--text-secondary)",
        fontSize: "13px",
        fontWeight: 400,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--teal-light)";
        e.currentTarget.style.color = "var(--primary-teal)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      {tool.icon && (
        <span style={{ display: "inline-flex", width: 16, height: 16, color: iconColor, transition: "color 0.15s ease" }}>
          <tool.icon size={14} strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      <span style={{ flex: 1 }}>{tool.name}</span>
    </Link>
  );
}

function ToolColumn({ group }: { group: ToolGroup }) {
  return (
    <div style={{ flex: 1, minWidth: "180px", maxWidth: "220px" }}>
      <div style={{ marginBottom: "12px", padding: "8px 12px", background: "var(--teal-light)", borderRadius: "8px" }}>
        <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--primary-teal)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {group.title}
        </h4>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {group.tools.map((tool) => (
          <ToolItem key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

export function ToolColumns({ category }: ToolColumnsProps) {
  return (
    <div className="mega-menu-tool-columns">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {category.groups.map((group) => (
          <ToolColumn key={group.title} group={group} />
        ))}
      </div>
    </div>
  );
}