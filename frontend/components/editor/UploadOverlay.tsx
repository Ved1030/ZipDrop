"use client";

interface UploadOverlayProps {
  onFileSelect: (file: File) => void;
  onStartBlank: () => void;
}

export default function UploadOverlay({ onFileSelect, onStartBlank }: UploadOverlayProps) {
  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx,.doc,.txt,.md,.rtf,.odt,.html";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
    };
    input.click();
  };

  return (
    <div
      id="overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,10,22,0.97)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        zIndex: 100,
      }}
    >
      <div
        id="drop-box"
        onClick={handleClick}
        style={{
          border: "2px dashed #2a2a3e",
          borderRadius: 16,
          padding: "56px 80px",
          textAlign: "center",
          cursor: "pointer",
          background: "#0f0f1a",
          transition: "border-color 0.2s,background 0.2s",
          maxWidth: 440,
        }}
        className="drop-box-hover"
      >
        <div
          id="drop-icon"
          style={{ fontSize: 48, color: "#00e5ff", marginBottom: 16 }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
          Open a document to edit
        </h2>
        <p style={{ fontSize: 13, color: "#888" }}>
          Click to browse — supports .docx and .txt<br />
          or drag &amp; drop a file here
        </p>
      </div>

      <div style={{ fontSize: 13, color: "#444" }}>— or —</div>

      <button
        onClick={onStartBlank}
        id="blank-btn"
        style={{
          padding: "10px 28px",
          background: "#00e5ff",
          color: "#000",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        Start with blank document
      </button>
    </div>
  );
}
