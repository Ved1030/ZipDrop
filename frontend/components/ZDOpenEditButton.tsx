"use client";

import React from "react";

interface Props {
  file: any;
  onOpen: () => void;
}

export default function ZDOpenEditButton({ file, onOpen }: Props) {
  if (!file) return null;

  return (
    <button
      onClick={onOpen}
      className="btn-ghost zd-edit-btn"
      style={{ 
        padding: "4px 10px", 
        flexShrink: 0, 
        textDecoration: "none",
        marginLeft: '8px',
        fontSize: '12px'
      }}
    >
      Open & Edit ✏️
    </button>
  );
}
