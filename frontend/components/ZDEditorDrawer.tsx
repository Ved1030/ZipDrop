"use client";

import React, { useState, useEffect, Suspense, lazy } from "react";
import ZDErrorBoundary from "./ZDErrorBoundary";

const ZDFormatAwareEditor = lazy(() => import("./ZDFormatAwareEditor"));
const ZDCollabSidebar = lazy(() => import("./ZDCollabSidebar"));

interface Props {
  file: any;
  onClose: () => void;
  onResend: (newCode: string) => void;
}

export default function ZDEditorDrawer({ file, onClose, onResend }: Props) {
  const [zd_isOpen, set_zd_isOpen] = useState(false);
  const [zd_content, set_zd_content] = useState("");
  const [zd_newCode, set_zd_newCode] = useState<string | null>(null);

  useEffect(() => {
    set_zd_isOpen(true);
    if (file && file.file_url) {
      fetch(file.file_url)
        .then(res => res.text())
        .then(text => set_zd_content(text))
        .catch(() => set_zd_content("Could not load file content."));
    }

    // Real-Time Sync (BroadcastChannel)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('zipdrop_' + file.file_name);
        channel.onmessage = (msg) => {
          if (msg.data.type === 'edit' && msg.data.author !== 'You') {
            set_zd_content(msg.data.content);
            (window as any).zd_addRemoteSnapshot?.(msg.data.content, msg.data.author);
          }
        };

        const debounceTimer = setTimeout(() => {
           channel.postMessage({ type: 'edit', content: zd_content, author: 'You' });
        }, 1000);

        return () => {
          channel.close();
          clearTimeout(debounceTimer);
        };
      } catch (err) {
        console.warn("BroadcastChannel failed", err);
      }
    }
  }, [file]);

  const handleResend = () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    (window as any).zdDropStore = (window as any).zdDropStore || new Map();
    (window as any).zdDropStore.set(newCode, zd_content);
    set_zd_newCode(newCode);
    onResend(newCode);
  };

  if (!file) return null;

  return (
    <>
      <div 
        className={`zd-overlay ${zd_isOpen ? 'zd-active' : ''}`} 
        onClick={() => { set_zd_isOpen(false); setTimeout(onClose, 300); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          zIndex: 499, backdropFilter: 'blur(10px)', opacity: zd_isOpen ? 1 : 0, transition: 'opacity 0.3s'
        }}
      />
      <div className={`zd-drawer ${zd_isOpen ? 'zd-open' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: `
          .zd-drawer { 
            position: fixed; right: 0; top: 0; height: 100vh; width: 560px;
            transform: translateX(100%); transition: transform 300ms ease-out;
            z-index: 500; display: flex; flex-direction: column;
            background: #050D0B; border-left: 0.5px solid var(--border-soft);
          }
          .zd-drawer.zd-open { transform: translateX(0); }
          .zd-collab-sidebar { width: 180px; flex-shrink: 0; background: rgba(0,0,0,0.2); border-left: 1px solid var(--border-soft); }

          @media (max-width: 768px) {
            .zd-drawer { 
              width: 100%; height: 90vh; top: auto; bottom: 0; right: 0;
              transform: translateY(100%); border-radius: 16px 16px 0 0; border-left: none; border-top: 1px solid var(--border-soft);
            }
            .zd-drawer.zd-open { transform: translateY(0); }
            .zd-collab-sidebar { display: none; }
          }
        ` }} />
        
        {/* TopBar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span style={{ fontWeight: 700, fontSize: '15px' }}>{file.file_name}</span>
             <span className="badge" style={{ fontSize: '10px' }}>EDITABLE</span>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00E5C0', boxShadow: '0 0 10px #00E5C0' }} />
          </div>
          <button onClick={() => { set_zd_isOpen(false); setTimeout(onClose, 300); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
           <div style={{ flex: 1, overflow: 'auto', background: '#050D0B' }}>
              <ZDErrorBoundary>
                <Suspense fallback={<div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading editor...</div>}>
                   <ZDFormatAwareEditor 
                      file={file} 
                      content={zd_content} 
                      onChange={set_zd_content} 
                   />
                </Suspense>
              </ZDErrorBoundary>
           </div>
           
           <div className="zd-collab-sidebar">
              <ZDErrorBoundary>
                <Suspense fallback={null}>
                   <ZDCollabSidebar onSnapshot={() => {}} content={zd_content} />
                </Suspense>
              </ZDErrorBoundary>
           </div>
        </div>

        {/* BottomBar */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={handleResend}
                className="btn-cyan" 
                style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '14px' }}
              >
                Resend edited file
              </button>
              {zd_newCode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>New Code:</span>
                   <span className="glow-text" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyan)' }}>{zd_newCode}</span>
                </div>
              )}
           </div>
           <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Autosaving locally...</span>
        </div>
      </div>
    </>
  );
}
