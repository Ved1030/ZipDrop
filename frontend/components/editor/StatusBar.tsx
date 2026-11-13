"use client";

interface StatusBarProps {
  pageCount: number;
  activePage: number;
  wordCount: number;
  charCount: number;
  zoom: number;
  onZoomChange: (z: number) => void;
  spellCheck: boolean;
}

export default function StatusBar({
  pageCount,
  activePage,
  wordCount,
  charCount,
  zoom,
  onZoomChange,
  spellCheck,
}: StatusBarProps) {
  const safeCount = Math.max(1, pageCount);
  const currentPage = Math.min(safeCount, Math.max(1, activePage + 1));
  return (
    <div
      id="statusbar"
      style={{
        background: "#ffffff",
        borderTop: "1px solid var(--border)",
        padding: "5px 20px",
        display: "flex",
        gap: 24,
        fontSize: 12,
        color: "var(--text-secondary)",
        flexShrink: 0,
        alignItems: "center",
      }}
    >
      <span>Page {currentPage} of {safeCount}</span>
      <span>Words: {wordCount.toLocaleString()}</span>
      <span>Characters: {charCount.toLocaleString()}</span>
      <span>English (US)</span>
      {spellCheck && (
        <span style={{ color: "var(--green-highlight)", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Spell check
        </span>
      )}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        {/* View buttons */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border)",
              borderRadius: 3,
              cursor: "pointer",
              background: "var(--primary-teal)",
              color: "#fff",
              fontSize: 14,
            }}
            title="Page view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
          </button>
          <button
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border)",
              borderRadius: 3,
              cursor: "pointer",
              background: "none",
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
            title="Two page view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
          </button>
          <button
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border)",
              borderRadius: 3,
              cursor: "pointer",
              background: "none",
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
            title="Reading view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
          </button>
        </div>

        {/* Zoom */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
          <button
            onClick={() => onZoomChange(Math.max(50, zoom - 10))}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              width: 22,
              height: 22,
              borderRadius: 3,
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            −
          </button>
          <span>{zoom}%</span>
          <button
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              width: 22,
              height: 22,
              borderRadius: 3,
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            +
          </button>
        </div>

        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer" }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
    </div>
  );
}
