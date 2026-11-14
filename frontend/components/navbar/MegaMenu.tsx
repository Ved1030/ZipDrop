"use client";

import { useEffect, useRef, useState, forwardRef } from "react";
import { TOOL_CATEGORIES, getCategoryById, DEFAULT_CATEGORY_ID } from "@/data/toolCategories";
import { CategoryNavigation } from "./CategoryNavigation";
import { ToolColumns } from "./ToolColumns";
import { X, ChevronDown } from "lucide-react";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function MegaMenu({ isOpen, onClose, triggerRef }: MegaMenuProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(DEFAULT_CATEGORY_ID);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const activeCategory = getCategoryById(activeCategoryId) || TOOL_CATEGORIES[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        megaMenuRef.current &&
        !megaMenuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={megaMenuRef}
      className="mega-menu"
      role="dialog"
      aria-label="Tools menu"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 20px 60px rgba(32, 43, 54, 0.15)",
        animation: "fadeInDown 0.2s ease forwards",
        maxHeight: "calc(100vh - 72px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
          All Tools
        </h2>
        <button
          onClick={onClose}
          aria-label="Close mega menu"
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
            transition: "all 0.18s ease",
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
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Fixed category navigation at top */}
      <CategoryNavigation activeCategoryId={activeCategoryId} onCategoryChange={setActiveCategoryId} />

      {/* Scrollable tool content area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "20px 24px",
          maxHeight: "calc(100vh - 200px)",
        }}
      >
        <ToolColumns category={activeCategory} />
      </div>
    </div>
  );
}

interface ToolsDropdownButtonProps {
  onClick: () => void;
  isOpen: boolean;
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ToolsDropdownButton = forwardRef<HTMLButtonElement, ToolsDropdownButtonProps>(
  ({ onClick, isOpen, onMouseEnter, onMouseLeave }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        style={{
          textDecoration: "none",
          color: isOpen ? "var(--primary-teal)" : "var(--text-secondary)",
          fontSize: "14px",
          fontWeight: 500,
          padding: "8px 12px",
          borderRadius: "8px",
          transition: "all 0.2s ease",
          background: isOpen ? "var(--teal-light)" : "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        Tools
        <ChevronDown size={14} strokeWidth={2.5} style={{ transition: "transform 0.2s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
    );
  }
);

ToolsDropdownButton.displayName = "ToolsDropdownButton";