"use client";
import TipTapEditor from "./TipTapEditor";
import { Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
  zoom: number;
}

export default function DocumentCanvas({ editor, zoom }: Props) {
  return (
    <div
      id="editor-canvas"
      style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        overflowX: 'auto',
        background: '#e8e8e8',
        padding: '32px 24px 64px',
      }}
    >
      <div
        className="doc-page"
        style={{
          background: 'white',
          width: '816px',
          minWidth: '816px',
          minHeight: '1056px',
          padding: '96px',
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          margin: '0 auto',
          flexShrink: 0,
          transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
          transformOrigin: 'top center',
        }}
      >
        <TipTapEditor editor={editor} />
      </div>
    </div>
  );
}
