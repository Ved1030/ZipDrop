"use client";

import React, { useState, useEffect } from "react";
import ZDVersionTrail from "./ZDVersionTrail";

interface Props {
  content: string;
  onSnapshot: () => void;
}

interface Peer {
  name: string;
  initials: string;
  color: string;
  status: string;
  joinedAt: number;
}

export default function ZDCollabSidebar({ content, onSnapshot }: Props) {
  const [peers, setPeers] = useState<Peer[]>([]);

  useEffect(() => {
    const names = ['Aarav', 'Riya', 'Tanvir', 'Priya', 'Kabir', 'Sneha', 'Arjun', 'Meera']
    const colors = ['#00E5C0','#00B4E5','#FFB830','#C9A7FF']

    const addPeer = (id: number) => {
      const name = names[Math.floor(Math.random() * names.length)];
      setPeers(prev => [...prev, {
        name,
        initials: name[0],
        color: colors[Math.floor(Math.random() * colors.length)],
        status: 'Viewing',
        joinedAt: Date.now()
      }]);
    };

    const joinTimer = setTimeout(() => {
      addPeer(1);
      setTimeout(() => addPeer(2), 2000); // add second shortly after
    }, 3000);

    const statusInterval = setInterval(() => {
      const statuses = ['Editing now', 'Viewing', 'Typing...', 'Selecting text', 'Idle'];
      setPeers(prev => prev.map(p => ({
        ...p,
        status: statuses[Math.floor(Math.random() * statuses.length)]
      })));
    }, 6000);

    return () => {
      clearTimeout(joinTimer);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px' }}>
      <div>
        <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '20px' }}>Collaborators</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {peers.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, fontSize: '13px' }}>
                 {p.initials}
              </div>
              <div>
                 <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{p.name}</p>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5C0', boxShadow: '0 0 6px #00E5C0' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.status}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, borderTop: '0.5px solid var(--border-soft)', paddingTop: '24px' }}>
          <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '20px' }}>Version Trail</h4>
          <ZDVersionTrail content={content} onRestore={() => {}} />
      </div>
    </div>
  );
}
