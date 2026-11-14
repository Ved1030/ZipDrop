"use client";

import { useMemo } from "react";
import { TOOL_CATEGORIES } from "@/data/toolCategories";

interface CategoryNavigationProps {
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryNavigation({ activeCategoryId, onCategoryChange }: CategoryNavigationProps) {
  const categoryItems = useMemo(() => TOOL_CATEGORIES, []);

  return (
    <nav
      className="mega-menu-category-nav"
      role="tablist"
      aria-label="Tool categories"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {categoryItems.map((category) => {
        const isActive = activeCategoryId === category.id;
        
        return (
          <button
            key={category.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${category.id}`}
            id={`tab-${category.id}`}
            onClick={() => onCategoryChange(category.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              background: isActive ? category.iconBg : "transparent",
              color: isActive ? category.iconColor : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: isActive ? 600 : 500,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "all 0.18s ease",
              whiteSpace: "nowrap",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "var(--editor-workspace)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                color: category.iconColor,
                transition: "color 0.18s ease",
              }}
            >
              <category.icon size={18} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span>{category.name}</span>
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  bottom: -1,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "60%",
                  height: 2,
                  background: category.iconColor,
                  borderRadius: "2px 2px 0 0",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}