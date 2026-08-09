"use client";

interface InfoType {
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  pageCount?: number;
  wordCount?: number;
  charCount?: number;
  modifiedAt?: string;
  createdAt?: string;
}

interface Props {
  info: InfoType;
  showRulers: boolean;
  showPageBreaks: boolean;
  spellCheck: boolean;
  onToggleRulers: () => void;
  onTogglePageBreaks: () => void;
  onToggleSpellCheck: () => void;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none',
        background: on ? '#1a73e8' : '#ccc',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: on ? 19 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        display: 'block',
      }} />
    </button>
  );
}

function InfoRow({ label, value, badge }: { label: string; value: string | number; badge?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
      <span style={{ color: '#888' }}>{label}</span>
      {badge ? (
        <span style={{ background: '#1a73e8', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3 }}>{value}</span>
      ) : (
        <span style={{ color: '#333', fontWeight: 500 }}>{value}</span>
      )}
    </div>
  );
}

function OptionRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 13 }}>
      <span style={{ color: '#555' }}>{label}</span>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

export default function RightSidebar({ info, showRulers, showPageBreaks, spellCheck, onToggleRulers, onTogglePageBreaks, onToggleSpellCheck }: Props) {
  return (
    <div style={{
      width: 220, minWidth: 220, flexShrink: 0,
      background: '#fafafa', borderLeft: '1px solid #e0e0e0',
      overflowY: 'auto', padding: 16,
      fontFamily: "'Segoe UI', Arial, sans-serif",
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        Document <span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>ⓘ</span>
      </div>
      <InfoRow label="File name" value={info?.fileName || '—'} />
      <InfoRow label="File type" value={info?.fileType || 'DOCX'} badge />
      <InfoRow label="File size" value={info?.fileSize || '—'} />
      <InfoRow label="Pages" value={info?.pageCount ?? 1} />
      <InfoRow label="Words" value={(info?.wordCount ?? 0).toLocaleString()} />
      <InfoRow label="Characters" value={(info?.charCount ?? 0).toLocaleString()} />
      <InfoRow label="Last modified" value={info?.modifiedAt || '—'} />
      <InfoRow label="Created" value={info?.createdAt || '—'} />
      <div style={{ borderTop: '1px solid #e0e0e0', margin: '14px 0' }} />
      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        Document options <span>∧</span>
      </div>
      <OptionRow label="Show rulers" on={showRulers} onToggle={onToggleRulers} />
      <OptionRow label="Show page breaks" on={showPageBreaks} onToggle={onTogglePageBreaks} />
      <OptionRow label="Spell check" on={spellCheck} onToggle={onToggleSpellCheck} />
    </div>
  );
}
