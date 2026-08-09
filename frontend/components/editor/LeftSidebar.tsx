"use client";

import type { Editor } from "@tiptap/react";

interface LeftSidebarProps {
  pageCount: number;
  editor: Editor | null;
}

export default function LeftSidebar({ pageCount, editor }: LeftSidebarProps) {
  const handleAddPage = () => {
    editor?.chain().focus().setHorizontalRule().run();
  };

  return (
    <div
      id="pages-panel"
      style={{
        width: 130,
        background: "#fafafa",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <div
        id="pages-header"
        style={{
          padding: "10px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "#5f6368",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e0e0e0",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Pages
        <span
          onClick={handleAddPage}
          title="Add page"
          style={{ fontSize: 16, cursor: "pointer", color: "#1a73e8" }}
        >
          +
        </span>
      </div>
      <div
        style={{
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {Array.from({ length: pageCount }).map((_, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: 4,
              overflow: "hidden",
              cursor: "pointer",
              border: idx === 0 ? "2px solid #1a73e8" : "2px solid transparent",
              transition: "border-color 0.15s",
            }}
          >
            <div
              style={{
                background: "#fff",
                width: "100%",
                aspectRatio: "0.77",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                overflow: "hidden",
                padding: 6,
              }}
            >
              <div
                id="thumbContent"
                style={{
                  width: "100%",
                  fontSize: 3,
                  color: "#333",
                  lineHeight: 1.4,
                  overflow: "hidden",
                }}
              />
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "#5f6368",
                marginTop: 4,
              }}
            >
              {idx + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
