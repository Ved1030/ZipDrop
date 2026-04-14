"use client";

import React, { useState } from "react";
import { openFileInEditor } from "../utils/openFileInEditor";

interface Props {
  file: any;
  onOpen: () => void; // kept for API compatibility — no longer used
}

export default function ZDOpenEditButton({ file }: Props) {
  const [loading, setLoading] = useState(false);

  if (!file) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      await openFileInEditor({
        file_name: file.file_name,
        file_url: file.file_url,
        file_size: file.file_size,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-ghost zd-edit-btn"
      style={{
        padding: "4px 10px",
        flexShrink: 0,
        textDecoration: "none",
        marginLeft: "8px",
        fontSize: "12px",
        opacity: loading ? 0.6 : 1,
        cursor: loading ? "wait" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {loading ? (
        <>
          <span
            style={{
              width: "10px",
              height: "10px",
              border: "1.5px solid rgba(0,229,192,0.3)",
              borderTopColor: "#00E5C0",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
          Loading…
        </>
      ) : (
        "Open & Edit ✏️"
      )}
    </button>
  );
}
