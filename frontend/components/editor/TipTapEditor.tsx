"use client";

import { EditorContent, type Editor } from "@tiptap/react";

interface TipTapEditorProps {
  editor: Editor | null;
}

export default function TipTapEditor({ editor }: TipTapEditorProps) {
  return (
    <div
      className="editor-content"
      style={{
        outline: "none",
        minHeight: 864,
        fontSize: "11pt",
        lineHeight: 1.7,
        color: "var(--text-primary)",
        fontFamily: "'Calibri','Segoe UI',Arial,sans-serif",
        caretColor: "var(--primary-teal)",
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
