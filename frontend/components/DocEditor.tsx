"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { useEffect, useState, useCallback } from "react";

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}px` };
        },
        parseHTML: (element) => element.style.fontSize?.replace("px", "") || null,
      },
    };
  },
});

interface DocEditorProps {
  fileUrl: string;
  filename: string;
  defaultRecipientCode?: string;
}

export default function DocEditor({
  fileUrl,
  filename,
  defaultRecipientCode,
}: DocEditorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [synced, setSynced] = useState(true);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState("11");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
      FontSize,
    ],
    content: "",
    editorProps: {
      attributes: {
        style: [
          "outline: none",
          "min-height: 1056px",
          "padding: 72px 96px",
          "font-family: Arial, sans-serif",
          "font-size: 11pt",
          "line-height: 1.6",
          "color: #1A1A1A",
        ].join(";"),
      },
    },
    onUpdate: () => setSynced(false),
  });

  useEffect(() => {
    if (!fileUrl || !editor) return;

    setLoading(true);
    setError(null);

    fetch("/api/convert-to-html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.html) {
          editor.commands.setContent(data.html, false);
        } else {
          throw new Error(data.error || "No HTML returned");
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        console.error("Load error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [fileUrl, editor]);

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleUnderline = useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]);
  const toggleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);
  const toggleH1 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 1 }).run(), [editor]);
  const toggleH2 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor]);
  const toggleH3 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 3 }).run(), [editor]);
  const setAlignLeft = useCallback(() => editor?.chain().focus().setTextAlign("left").run(), [editor]);
  const setAlignCenter = useCallback(() => editor?.chain().focus().setTextAlign("center").run(), [editor]);
  const setAlignRight = useCallback(() => editor?.chain().focus().setTextAlign("right").run(), [editor]);

  function setFont(font: string) {
    setFontFamily(font);
    editor?.chain().focus().setFontFamily(font).run();
  }

  function setSize(size: string) {
    setFontSize(size);
    editor?.chain().focus().setMark("textStyle", { fontSize: size }).run();
  }

  async function handleResend() {
    if (!editor) return;
    const code = defaultRecipientCode || "0000";
    setSending(true);
    try {
      const html = editor.getHTML();
      const res = await fetch("/api/convert-to-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, filename }),
      });
      if (!res.ok) throw new Error(`Convert failed: ${res.status}`);
      const docxBlob = await res.blob();
      const ext = "docx";
      const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const outBlob = new Blob([docxBlob], { type: mime });
      const outName = filename.replace(/\.[^.]+$/, "") + "_edited." + ext;
      const fd = new FormData();
      fd.append("file", outBlob, outName);
      fd.append("recipientCode", code);
      const sendRes = await fetch("/api/send", {
        method: "POST",
        body: fd,
      });
      if (!sendRes.ok) throw new Error(`Send failed: ${sendRes.status}`);
      setSynced(true);
      alert("Sent successfully!");
    } catch (err: any) {
      console.error("Resend error:", err);
      alert("Send failed: " + err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDownload() {
    if (!editor) return;
    try {
      const html = editor.getHTML();
      const res = await fetch("/api/convert-to-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, filename }),
      });
      if (!res.ok) throw new Error(`Convert failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.replace(/\.[^.]+$/, "") + "_edited.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download error:", err);
      alert("Download failed: " + err.message);
    }
  }

  function handleClose() {
    if (!synced) {
      if (!confirm("You have unsaved changes. Close anyway?")) return;
    }
    window.close();
  }

  const btnClass = (active?: boolean) =>
    `px-2 py-1 text-xs rounded ${active ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"} transition-colors`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E8E7E2]">
        <div className="text-gray-500 text-sm">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#E8E7E2] gap-4">
        <p className="text-gray-500 text-sm">Could not load document content.</p>
        <p className="text-gray-400 text-xs max-w-md text-center">{error}</p>
        <a href={fileUrl} download className="text-emerald-600 underline text-sm">
          Download original
        </a>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#E8E7E2]">
      {/* TOP BAR */}
      <div className="flex items-center gap-3 px-4 h-12 bg-white border-b border-gray-200 shrink-0">
        <span className="text-emerald-600 font-bold text-sm tracking-tight">ZipDrop</span>
        <span className="text-xs text-gray-400 mx-1">/</span>
        <span className="text-sm text-gray-800 font-medium truncate max-w-[240px]">{filename}</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-none">
          Editable
        </span>
        <button onClick={handleClose} className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-1 px-3 h-10 bg-white border-b border-gray-200 shrink-0 overflow-x-auto">
        <select
          value={fontFamily}
          onChange={(e) => setFont(e.target.value)}
          className="text-xs border border-gray-300 rounded px-1.5 py-1 text-gray-700 bg-white w-24"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>
        <select
          value={fontSize}
          onChange={(e) => setSize(e.target.value)}
          className="text-xs border border-gray-300 rounded px-1.5 py-1 text-gray-700 bg-white w-16"
        >
          {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72].map((s) => (
            <option key={s} value={String(s)}>{s}</option>
          ))}
        </select>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button onClick={toggleBold} className={btnClass(editor?.isActive("bold"))} title="Bold"><b>B</b></button>
        <button onClick={toggleItalic} className={btnClass(editor?.isActive("italic"))} title="Italic"><i>I</i></button>
        <button onClick={toggleUnderline} className={btnClass(editor?.isActive("underline"))} title="Underline"><u>U</u></button>
        <button onClick={toggleStrike} className={btnClass(editor?.isActive("strike"))} title="Strikethrough"><s>S</s></button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button onClick={toggleH1} className={btnClass(editor?.isActive("heading", { level: 1 }))} title="Heading 1">H1</button>
        <button onClick={toggleH2} className={btnClass(editor?.isActive("heading", { level: 2 }))} title="Heading 2">H2</button>
        <button onClick={toggleH3} className={btnClass(editor?.isActive("heading", { level: 3 }))} title="Heading 3">H3</button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button onClick={setAlignLeft} className={btnClass(editor?.isActive("textAlign", "left"))} title="Align left">&#x2190;</button>
        <button onClick={setAlignCenter} className={btnClass(editor?.isActive("textAlign", "center"))} title="Align center">&#x2194;</button>
        <button onClick={setAlignRight} className={btnClass(editor?.isActive("textAlign", "right"))} title="Align right">&#x2192;</button>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        {/* CANVAS */}
        <div className="flex-1 overflow-y-auto bg-[#E8E7E2] p-8">
          <div className="max-w-[816px] mx-auto bg-white shadow-lg min-h-[1056px] rounded-sm">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-64 shrink-0 bg-white border-l border-gray-200 p-4 overflow-y-auto flex flex-col gap-6">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Collaborators</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-semibold">Y</div>
              <span>You (owner)</span>
            </div>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Version Trail</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-700 font-medium">Current version</p>
                  <p className="text-[11px] text-gray-400">Edited just now</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Original upload</p>
                  <p className="text-[11px] text-gray-400">Opened for editing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="flex items-center justify-between px-4 h-10 bg-white border-t border-gray-200 shrink-0">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <span className={synced ? "text-emerald-500" : "text-amber-500"}>&#x2713;</span>
          {synced ? "Synced" : "Unsaved changes"}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-xs px-3 py-1.5 rounded bg-emerald-500 text-white hover:bg-emerald-600 font-medium disabled:opacity-50"
          >
            {sending ? "Sending..." : "\u2191 Resend edited file"}
          </button>
          <button
            onClick={handleDownload}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {"\u2193"} Download edited
          </button>
        </div>
      </div>
    </div>
  );
}
