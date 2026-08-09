"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/react";

interface LeftSidebarProps {
  pageCount: number;
  editor: Editor | null;
  activePage: number;
  onPageChange: (page: number) => void;
}

export default function LeftSidebar({ pageCount, editor, activePage, onPageChange }: LeftSidebarProps) {
  const handleAddPage = useCallback(() => {
    const canvas = document.querySelector("#editor-canvas");
    if (canvas) {
      canvas.scrollTo({ top: canvas.scrollHeight, behavior: "smooth" });
    }
    editor?.commands.focus("end");
  }, [editor]);

  const handlePageClick = useCallback((pageIndex: number) => {
    onPageChange(pageIndex);
    const canvas = document.querySelector("#editor-canvas");
    if (canvas) {
      canvas.scrollTo({ top: pageIndex * 1056, behavior: "smooth" });
    }
  }, [onPageChange]);

  return (
    <div
      id="pages-panel"
      style={{
        width: "150px",
        minWidth: "150px",
        flexShrink: 0,
        background: "#f5f5f5",
        borderRight: "1px solid #e0e0e0",
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
          color: "#5f6368",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Pages
        <span
          onClick={handleAddPage}
          title="Scroll to end of document"
          style={{ fontSize: 16, cursor: "pointer", color: "#1a73e8" }}
        >
          +
        </span>
      </div>
      {Array.from({ length: pageCount }).map((_, idx) => (
        <div
          key={idx}
          className="page-thumb"
          onClick={() => handlePageClick(idx)}
          style={{
            width: "110px",
            height: "142px",
            background: "white",
            border: idx === activePage ? "2px solid #1a73e8" : "1px solid #ccc",
            borderRadius: "2px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "4px",
            fontSize: "10px",
            color: "#999",
            boxSizing: "border-box",
          }}
        >
          {idx + 1}
        </div>
      ))}
    </div>
  );
}
