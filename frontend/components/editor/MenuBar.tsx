"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";

const ITEMS = ["File", "Edit", "Insert", "Format", "Tools", "View", "Help"];

interface MenuBarProps {
  editor: Editor | null;
  onNewDocument: () => void;
  onOpenFile: () => void;
  onDownload: (format: string) => void;
  onZoom: (delta: number) => void;
}

export default function MenuBar({
  editor,
  onNewDocument,
  onOpenFile,
  onDownload,
  onZoom,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDocClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenu]);

  const handleInsertImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (src) editor?.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  const handleInsertPageBreak = useCallback(() => {
    editor
      ?.chain()
      .focus()
      .insertContent('<p style="page-break-after: always;">&nbsp;</p>')
      .run();
  }, [editor]);

  const menus: Record<string, { label: string; action: () => void }[]> = {
    File: [
      { label: "New Document", action: onNewDocument },
      { label: "Open File", action: onOpenFile },
      { label: "Download as DOCX", action: () => onDownload("docx") },
      { label: "Download as TXT", action: () => onDownload("txt") },
    ],
    Edit: [
      { label: "Undo", action: () => editor?.chain().focus().undo().run() },
      { label: "Redo", action: () => editor?.chain().focus().redo().run() },
      { label: "Select All", action: () => editor?.chain().focus().selectAll().run() },
    ],
    Insert: [
      { label: "Image", action: handleInsertImage },
      { label: "Table", action: () => editor?.chain().focus().insertTable({ rows: 2, cols: 2 }).run() },
      { label: "Horizontal Rule", action: () => editor?.chain().focus().setHorizontalRule().run() },
      { label: "Page Break", action: handleInsertPageBreak },
    ],
    Format: [
      { label: "Bold", action: () => editor?.chain().focus().toggleBold().run() },
      { label: "Italic", action: () => editor?.chain().focus().toggleItalic().run() },
      { label: "Underline", action: () => editor?.chain().focus().toggleUnderline().run() },
      { label: "Heading 1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: "Heading 2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: "Clear Formatting", action: () => editor?.chain().focus().clearNodes().unsetAllMarks().run() },
    ],
    View: [
      { label: "Zoom In", action: () => onZoom(10) },
      { label: "Zoom Out", action: () => onZoom(-10) },
    ],
  };

  const shellBg = "#ffffff";
  const shellBorder = "#e0e0e0";
  const textColor = "#3c3c3c";
  const activeBg = "#e8f0fe";
  const menuBg = "#ffffff";
  const hoverBg = "#f1f3f4";

  return (
    <div
      ref={barRef}
      id="menubar"
      style={{
        background: shellBg,
        borderBottom: `1px solid ${shellBorder}`,
        padding: "2px 12px",
        display: "flex",
        gap: 2,
        flexShrink: 0,
      }}
    >
      {ITEMS.map((item) => (
        <div key={item} style={{ position: "relative" }}>
          <button
            className="menu-item"
            onClick={() => setOpenMenu(openMenu === item ? null : item)}
            style={{
              padding: "5px 12px",
              fontSize: 13,
              color: textColor,
              borderRadius: 4,
              cursor: "pointer",
              border: "none",
              background: openMenu === item ? activeBg : "none",
              transition: "background 0.1s",
            }}
          >
            {item}
          </button>
          {openMenu === item && menus[item] && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                minWidth: 190,
                background: menuBg,
                border: `1px solid ${shellBorder}`,
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)",
                padding: 4,
                zIndex: 400,
              }}
            >
              {menus[item].map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    setOpenMenu(null);
                    m.action();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 12px",
                    fontSize: 13,
                    color: textColor,
                    borderRadius: 3,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
