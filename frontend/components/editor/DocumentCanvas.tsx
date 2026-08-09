"use client";

import { ReactNode } from "react";

interface DocumentCanvasProps {
  children: ReactNode;
  zoom: number;
}

export default function DocumentCanvas({ children, zoom }: DocumentCanvasProps) {
  return (
    <div
      id="canvas"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 24px",
        background: "#f0f0f0",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        id="canvas-inner"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          width: "100%",
          maxWidth: 860,
        }}
      >
        <div
          className="doc-page"
          style={{
            background: "#fff",
            width: 816,
            minHeight: 1056,
            padding: 96,
            boxShadow: "0 2px 8px rgba(0,0,0,0.14), 0 8px 32px rgba(0,0,0,0.1)",
            borderRadius: 2,
            position: "relative",
            flexShrink: 0,
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
