"use client";

import { useCallback } from "react";
import type { PageInfo } from "@/lib/editor/paginated-types";

interface LeftSidebarProps {
  pages: PageInfo[];
  activePage: number;
  onPageSelect: (pageIndex: number) => void;
  onScrollToEnd: () => void;
}

export default function LeftSidebar({
  pages,
  activePage,
  onPageSelect,
  onScrollToEnd,
}: LeftSidebarProps) {
  const handlePageClick = useCallback(
    (pageIndex: number) => {
      onPageSelect(pageIndex);
    },
    [onPageSelect]
  );

  return (
    <div
      id="pages-panel"
      style={{
        width: "150px",
        minWidth: "150px",
        flexShrink: 0,
        background: "var(--editor-workspace)",
        borderRight: "1px solid var(--border)",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        id="pages-header"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Pages
        <span
          onClick={onScrollToEnd}
          title="Go to end of document"
          style={{ fontSize: 16, cursor: "pointer", color: "var(--primary-teal)" }}
        >
          +
        </span>
      </div>
      {pages.map((page, idx) => (
        <div
          key={`${page.id}-${idx}`}
          className="page-thumb"
          data-page-index={idx}
          onClick={() => handlePageClick(idx)}
          title={`Page ${idx + 1}`}
          style={{
            width: "118px",
            border: idx === activePage ? "2px solid var(--primary-teal)" : "1px solid var(--border)",
            borderRadius: "2px",
            boxShadow:
              idx === activePage
                ? "0 2px 8px rgba(7,140,145,0.20)"
                : "0 1px 3px rgba(32,43,54,0.10)",
            cursor: "pointer",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
            background: "white",
            boxSizing: "border-box",
            lineHeight: 0,
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: page.thumbnailHtml }} />
          <div
            style={{
              position: "absolute",
              right: 4,
              bottom: 4,
              padding: "1px 5px",
              borderRadius: 3,
              background: idx === activePage ? "var(--primary-teal)" : "rgba(255,255,255,0.9)",
              color: idx === activePage ? "#fff" : "var(--text-secondary)",
              fontSize: 10,
              lineHeight: 1.4,
              fontWeight: 600,
            }}
          >
            {idx + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
