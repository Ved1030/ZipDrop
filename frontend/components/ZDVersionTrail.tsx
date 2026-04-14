"use client";

import React, { useState, useEffect } from "react";

interface Snapshot {
  id: string;
  tag: string;
  content: string;
  author: string;
  timestamp: number;
}

interface Props {
  content: string;
  onRestore: (content: string) => void;
}

export default function ZDVersionTrail({ content, onRestore }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    if (!content) return;

    const timer = setTimeout(() => {
      const newSnapshot: Snapshot = {
        id: Math.random().toString(36).substr(2, 9),
        tag: `v${snapshots.length + 1}`,
        author: 'You',
        timestamp: Date.now(),
        content: content
      };

      setSnapshots(prev => {
        const next = [newSnapshot, ...prev];
        return next.slice(0, 10);
      });
    }, 10000); // 10s debounce for autosave

    return () => clearTimeout(timer);
  }, [content]);

  const getTimeAgo = (ts: number) => {
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    return `${Math.floor(min / 60)}h ago`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {snapshots.map((s, i) => (
        <div 
          key={s.id} 
          onClick={() => onRestore(s.content)}
          style={{ 
            padding: '12px', 
            borderRadius: '10px', 
            border: '1px solid var(--border-soft)', 
            background: i === 0 ? 'rgba(0,229,192,0.05)' : 'none',
            borderLeft: i === 0 ? '3px solid #00E5C0' : '1px solid var(--border-soft)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: i === 0 ? '#00E5C0' : 'var(--text-primary)' }}>{s.tag}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{getTimeAgo(s.timestamp)}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.author}</p>
        </div>
      ))}
      
      {snapshots.length === 0 && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
          Initializing history...
        </p>
      )}
    </div>
  );
}
