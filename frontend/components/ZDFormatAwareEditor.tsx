"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  file: any;
  content: string;
  onChange: (content: string) => void;
}

export default function ZDFormatAwareEditor({ file, content, onChange }: Props) {
  const [editorType, setEditorType] = useState<string>("text");
  const [activeCell, setActiveCell] = useState("A1");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const ext = file.file_name.split('.').pop()?.toLowerCase();
    if (['docx', 'gdoc', 'txt', 'md'].includes(ext || '')) setEditorType("rich-text");
    else if (['xlsx', 'csv'].includes(ext || '')) setEditorType("spreadsheet");
    else if (['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json'].includes(ext || '')) setEditorType("code");
    else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')) setEditorType("image");
    else setEditorType("plain-text");
    
    // Code highlighting injection
    if (['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json'].includes(ext || '')) {
       if (!(window as any).hljs) {
         const script = document.createElement("script");
         script.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js";
         script.async = true;
         script.onload = () => {
           const style = document.createElement("link");
           style.rel = "stylesheet";
           style.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css";
           document.head.appendChild(style);
         };
         document.body.appendChild(script);
       }
    }
  }, [file]);

  // IMAGE FILTER LOGIC
  const applyFilter = (filter: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (filter === 'blur(4px)') {
      canvas.style.filter = filter;
      return;
    } else {
      canvas.style.filter = 'none';
    }

    const img = new Image();
    img.src = file.file_url;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        if (filter === 'grayscale') {
          const v = 0.3 * r + 0.59 * g + 0.11 * b;
          data[i] = data[i + 1] = data[i + 2] = v;
        } else if (filter === 'sepia') {
          data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
          data[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
          data[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
        } else if (filter === 'brighten') {
          data[i] = Math.min(255, r + 40);
          data[i + 1] = Math.min(255, g + 40);
          data[i + 2] = Math.min(255, b + 40);
        } else if (filter === 'invert') {
          data[i] = 255 - r;
          data[i + 1] = 255 - g;
          data[i + 2] = 255 - b;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    };
  };

  const renderEditor = () => {
    switch (editorType) {
      case "rich-text":
        return (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="zd-editor-toolbar" style={{ width: '100%', maxWidth: '680px', display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['bold', 'italic', 'underline', 'createLink'].map(cmd => (
                <button key={cmd} onClick={() => {
                  const val = cmd === 'createLink' ? prompt("URL:") : null;
                  document.execCommand(cmd, false, val || "");
                }} style={{ padding: '4px 8px', textTransform: 'capitalize' }}>{cmd.replace('createLink', 'Link')}</button>
              ))}
            </div>
            <div 
              ref={editorRef}
              contentEditable 
              suppressContentEditableWarning
              onInput={e => onChange(e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                background: 'rgba(255,255,255,0.02)', padding: '40px', width: '100%', maxWidth: '680px',
                minHeight: '600px', borderRadius: '16px', outline: 'none', lineHeight: 1.6, color: 'var(--text-secondary)'
              }}
            />
          </div>
        );

      case "spreadsheet":
        const rows = content.split('\n').map(r => r.split(','));
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>
               <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>f(x)</span>
               <span style={{ color: 'var(--text-muted)', width: '32px' }}>{activeCell}</span>
               <input 
                  type="text" 
                  value={content.split('\n')[0]} 
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)' }} 
               />
            </div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {(rows.length > 1 ? rows : [['Editable preview loading...']]).map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td 
                          key={j} 
                          contentEditable 
                          onFocus={() => setActiveCell(`${String.fromCharCode(65+j)}${i+1}`)}
                          style={{ border: '1px solid var(--border-soft)', padding: '10px 16px', minWidth: '100px' }}
                        >{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "code":
        return (
          <div style={{ position: 'relative', display: 'flex', minHeight: '100%' }}>
            <div style={{ width: '40px', background: 'rgba(0,0,0,0.2)', padding: '16px 0', textAlign: 'center', borderRight: '1px solid var(--border-soft)', flexShrink: 0, color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
               {content.split('\n').map((_, i) => <div key={i}>{i+1}</div>)}
            </div>
            <pre 
              ref={editorRef}
              contentEditable 
              suppressContentEditableWarning
              onInput={e => {
                const text = e.currentTarget.innerText;
                onChange(text);
                // Debounced highlight (simplified here)
              }}
              style={{ flex: 1, padding: '16px', margin: 0, outline: 'none', whiteSpace: 'pre', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
            >
              <code id="code-block">{content}</code>
            </pre>
          </div>
        );

      case "image":
        return (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
               {['normal', 'grayscale', 'sepia', 'brighten', 'invert', 'blur(4px)'].map(f => (
                 <button key={f} onClick={() => applyFilter(f)} className="btn-ghost" style={{ fontSize: '11px' }}>{f.replace('(4px)', '')}</button>
               ))}
            </div>
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
               <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', transition: 'filter 0.3s' }} />
            </div>
          </div>
        );

      default:
        return (
          <textarea 
            value={content} 
            onChange={e => onChange(e.target.value)}
            style={{ width: '100%', height: '100%', minHeight: '80vh', padding: '32px', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px', resize: 'none' }}
          />
        );
    }
  };

  useEffect(() => {
    if (editorType === 'image' && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        const img = new Image();
        img.src = file.file_url;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            canvasRef.current!.width = img.width > 800 ? 800 : img.width;
            canvasRef.current!.height = (img.height / img.width) * canvasRef.current!.width;
            ctx?.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
        };
    }
  }, [editorType, file.file_url]);

  return renderEditor();
}
