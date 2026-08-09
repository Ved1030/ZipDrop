"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  TableIcon,
  Image as ImageIcon,
  Link,
  Minus,
  Code,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  RemoveFormatting,
  Indent,
  Outdent,
} from "lucide-react";
import { FONT_FAMILIES, FONT_SIZES } from "@/lib/editor/extensions";

interface ToolbarProps {
  editor: Editor | null;
}

type ChainWithIndent = ReturnType<Editor["chain"]> & {
  indent: () => { run: () => boolean };
  outdent: () => { run: () => boolean };
};

function Btn({
  active,
  onClick,
  title,
  children,
  style: btnStyle,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
        className="tb"
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: active ? "#e8f0fe" : "none",
          borderRadius: 4,
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 14,
          color: disabled ? "#bbb" : active ? "#1a73e8" : "#3c3c3c",
          transition: "all 0.1s",
          opacity: disabled ? 0.4 : 1,
          ...btnStyle,
        }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 22, background: "#e0e0e0", margin: "0 4px" }} />;
}

function Sel({
  value,
  onChange,
  options,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="tb-sel"
      style={{
        height: 30,
        border: "1px solid #dadce0",
        borderRadius: 4,
        fontSize: 13,
        padding: "0 6px",
        background: "#ffffff",
        color: "#3c3c3c",
        cursor: "pointer",
        outline: "none",
        width: width || 100,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function Toolbar({ editor }: ToolbarProps) {
  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:", "https://");
    if (url && url !== "https://") {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleInsertTable = useCallback(() => {
    if (!editor) return;
    const s = window.prompt("Table size (rows x cols):", "3x3");
    if (s) {
      const [r, c] = s.split("x").map(Number);
      if (r > 0 && c > 0) {
        editor.chain().focus().insertTable({ rows: r, withHeaderRow: true }).run();
      }
    }
  }, [editor]);

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

  const handleInsertCodeBlock = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleCode().run();
  }, [editor]);

  if (!editor) return null;

  const fontOptions = FONT_FAMILIES.map((f) => ({ value: f, label: f }));
  const sizeOptions = FONT_SIZES.map((s) => ({ value: s, label: s }));

  const currentFontSize =
    editor.getAttributes("textStyle").fontSize || "11";

  return (
    <>
      <div
        id="toolbar"
        style={{
          background: "#f8f9fa",
          borderBottom: "1px solid #e0e0e0",
          padding: "5px 12px",
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        {/* Undo / Redo */}
        <Btn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo2 size={16} />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo2 size={16} />
        </Btn>

        <Sep />

        {/* Font family */}
        <Sel
          value={editor.getAttributes("textStyle").fontFamily || "Arial"}
          onChange={(v) => {
            if (v === "Arial") {
              editor.chain().focus().unsetFontFamily().run();
            } else {
              editor.chain().focus().setFontFamily(v).run();
            }
          }}
          options={fontOptions}
          width="120px"
        />

        {/* Font size */}
        <Sel
          value={currentFontSize}
          onChange={(v) => {
            editor.chain().focus().setFontSize(v).run();
          }}
          options={sizeOptions}
          width="56px"
        />

        <Sep />

        {/* Text color */}
        <label
          title="Text color"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "0 4px",
            cursor: "pointer",
            fontSize: 13,
            color: "#3c3c3c",
          }}
        >
          A
          <input
            type="color"
            value={editor.getAttributes("textStyle").color || "#000000"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            style={{ width: 20, height: 20, border: "none", borderRadius: 3, cursor: "pointer", padding: 0, background: "none" }}
          />
        </label>

        {/* Highlight */}
        <Btn
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          <Highlighter size={16} />
        </Btn>

        <Sep />

        {/* Bold / Italic / Underline / Strike */}
        <Btn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </Btn>
        <Btn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </Btn>
        <Btn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </Btn>
        <Btn
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </Btn>
        <Btn
          active={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          title="Superscript"
          style={{ fontSize: 11 }}
        >
          X&#178;
        </Btn>
        <Btn
          active={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          title="Subscript"
          style={{ fontSize: 11 }}
        >
          X&#8322;
        </Btn>

        <Sep />

        {/* Clear formatting */}
        <Btn
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear formatting"
        >
          <RemoveFormatting size={16} />
        </Btn>

        <Sep />

        {/* Alignment */}
        <Btn
          active={editor.isActive("textAlign", { align: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align left"
        >
          <AlignLeft size={16} />
        </Btn>
        <Btn
          active={editor.isActive("textAlign", { align: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Center"
        >
          <AlignCenter size={16} />
        </Btn>
        <Btn
          active={editor.isActive("textAlign", { align: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          <AlignRight size={16} />
        </Btn>
        <Btn
          active={editor.isActive("textAlign", { align: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          title="Justify"
        >
          <AlignJustify size={16} />
        </Btn>

        <Sep />

        {/* Lists */}
        <Btn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List size={16} />
        </Btn>
        <Btn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered size={16} />
        </Btn>
        <Btn
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Checklist"
        >
          <CheckSquare size={16} />
        </Btn>

        <Sep />

        {/* Indent / Outdent */}
        <Btn
          onClick={() => (editor.chain().focus() as ChainWithIndent).indent().run()}
          title="Increase indent"
        >
          <Indent size={16} />
        </Btn>
        <Btn
          onClick={() => (editor.chain().focus() as ChainWithIndent).outdent().run()}
          title="Decrease indent"
        >
          <Outdent size={16} />
        </Btn>

        <Sep />

        {/* Inline code */}
        <Btn
          active={editor.isActive("code")}
          onClick={handleInsertCodeBlock}
          title="Inline code"
        >
          <Code size={16} />
        </Btn>

        {/* Horizontal rule */}
        <Btn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus size={16} />
        </Btn>

        <Sep />

        {/* Insert */}
        <Btn onClick={handleInsertTable} title="Insert table">
          <TableIcon size={16} />
        </Btn>
        <Btn onClick={handleInsertImage} title="Insert image">
          <ImageIcon size={16} />
        </Btn>
        <Btn onClick={handleInsertLink} title="Insert link">
          <Link size={16} />
        </Btn>
      </div>

      {/* Ruler */}
      <div
        id="ruler"
        style={{
          background: "#f8f9fa",
          borderBottom: "1px solid #e0e0e0",
          height: 24,
          display: "flex",
          alignItems: "center",
          paddingLeft: 154,
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", height: "100%" }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              style={{
                fontSize: 10,
                color: "#9aa0a6",
                width: 52,
                textAlign: "center",
                borderLeft: "1px solid #e0e0e0",
                height: 8,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 1,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
