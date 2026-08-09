"use client";

interface DocInfo {
  fileName: string;
  fileType: string;
  fileSize: string;
  pageCount: number;
  wordCount: number;
  charCount: number;
  createdAt: string;
  modifiedAt: string;
}

interface RightSidebarProps {
  info: DocInfo;
  showRulers: boolean;
  showPageBreaks: boolean;
  darkMode: boolean;
  spellCheck: boolean;
  onToggleRulers: () => void;
  onTogglePageBreaks: () => void;
  onToggleDarkMode: () => void;
  onToggleSpellCheck: () => void;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={on ? "toggle on" : "toggle"}
      style={{
        width: 36,
        height: 20,
        background: on ? "#1a73e8" : "#dadce0",
        borderRadius: 10,
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        border: "none",
      }}
    />
  );
}

export default function RightSidebar({
  info,
  showRulers,
  showPageBreaks,
  darkMode,
  spellCheck,
  onToggleRulers,
  onTogglePageBreaks,
  onToggleDarkMode,
  onToggleSpellCheck,
}: RightSidebarProps) {
  return (
    <div
      id="right-panel"
      style={{
        width: 220,
        background: "#fafafa",
        borderLeft: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <div
        id="right-panel-title"
        style={{
          padding: "14px 14px 10px",
          fontSize: 13,
          fontWeight: 600,
          color: "#3c3c3c",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        Document
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer" }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>

      <div className="info-group" style={{ padding: "12px 14px", borderBottom: "1px solid #e0e0e0" }}>
        {([
          ["File name", info.fileName, false],
          ["File type", info.fileType.toUpperCase(), true],
          ["File size", info.fileSize, false],
          ["Pages", String(info.pageCount), false],
          ["Words", info.wordCount.toLocaleString(), false],
          ["Characters", info.charCount.toLocaleString(), false],
          ["Last modified", info.modifiedAt, false],
          ["Created", info.createdAt, false],
        ] as [string, string, boolean][]).map(([label, value, isBadge], idx) => (
          <div
            key={idx}
            className="info-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              fontSize: 12,
            }}
          >
            <span className="info-label" style={{ color: "#5f6368" }}>{label}</span>
            {isBadge ? (
              <span className="info-badge" style={{ background: "#1a73e8", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>
                {value}
              </span>
            ) : (
              <span className="info-value" style={{ color: "#3c3c3c", fontWeight: 500, fontSize: label === "File name" ? 11 : 12 }}>
                {value}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="options-group" style={{ padding: "12px 14px" }}>
        <div
          className="options-title"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#5f6368",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Document options
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
        </div>

        {([
          ["Show rulers", showRulers, onToggleRulers],
          ["Show page breaks", showPageBreaks, onTogglePageBreaks],
          ["Dark mode", darkMode, onToggleDarkMode],
          ["Spell check", spellCheck, onToggleSpellCheck],
        ] as [string, boolean, () => void][]).map(([label, on, toggle], idx) => (
          <div
            key={idx}
            className="option-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              fontSize: 12,
              color: "#3c3c3c",
            }}
          >
            {label}
            <Toggle on={on as boolean} onClick={toggle as () => void} />
          </div>
        ))}
      </div>
    </div>
  );
}
