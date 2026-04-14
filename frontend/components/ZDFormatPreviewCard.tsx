"use client";

import React, { useEffect, useState } from "react";

interface Props {
  file: any;
  onEditClick: () => void;
}

export default function ZDFormatPreviewCard({ file, onEditClick }: Props) {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.file_url) return;
    
    const ext = file.file_name.split('.').pop()?.toLowerCase();
    const isText = ['txt', 'md', 'csv', 'js', 'py', 'json', 'ts', 'tsx', 'jsx', 'html', 'css'].includes(ext || '');

    if (isText) {
      fetch(file.file_url)
        .then(res => res.text())
        .then(text => setContent(text))
        .catch(() => setContent(null));
    }
  }, [file]);

  if (!file) return null;

  const ext = file.file_name.split('.').pop()?.toUpperCase();
  const size = file.file_size ? (file.file_size / 1024).toFixed(1) + ' KB' : 'Size unknown';
  
  const getFormatLabel = () => {
    const e = ext?.toLowerCase();
    if (['xlsx', 'csv'].includes(e || '')) return 'Spreadsheet';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(e || '')) return 'Image';
    if (e === 'pdf') return 'PDF Document';
    if (['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json'].includes(e || '')) return 'Code Source';
    return 'Document';
  };

  const renderSnippet = () => {
    const e = ext?.toLowerCase();
    if (['xlsx', 'csv'].includes(e || '')) {
      const rows = content?.split('\n').slice(0, 2) || [];
      return (
        <table style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.split(',').slice(0, 3).map((c, j) => (
                  <td key={j} style={{ border: '0.5px solid var(--border-soft)', padding: '2px 6px' }}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(e || '')) {
      return (
        <img 
          src={file.file_url} 
          alt="thumbnail" 
          style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '12px', marginTop: '12px', border: '1px solid var(--border-soft)' }} 
        />
      );
    }
    if (e === 'pdf') return <p style={{ fontSize: '11px', color: 'var(--cyan)', marginTop: '8px' }}>PDF · calculating pages…</p>;
    
    // Default text/code
    const lines = content?.split('\n').slice(0, 5) || [];
    return (
      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5, opacity: 0.8 }}>
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    );
  };

  return (
    <div className="zd-format-preview" style={{ marginBottom: '16px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-soft)', background: 'rgba(0,255,192,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="badge" style={{ fontSize: '10px', background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid var(--cyan)' }}>
          .{ext} · {getFormatLabel()} · {size}
        </span>
      </div>
      
      {renderSnippet()}

      <button 
        onClick={onEditClick}
        className="btn-ghost" 
        style={{ marginTop: '12px', background: 'none', padding: 0, fontSize: '12px', color: 'var(--cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        Edit before forwarding →
      </button>
    </div>
  );
}
