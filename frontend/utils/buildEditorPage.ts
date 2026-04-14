/* ─────────────────────────────────────────────────────────
   buildEditorPage.ts  (v2)
   Generates the full self-contained HTML for the ZipDrop
   editor tab. All element IDs are zd-* prefixed.
   ───────────────────────────────────────────────────────── */

export function buildEditorPage(
  fileName: string,
  fileType: string,
  content: string,
  fileSize?: number
): string {
  const safeJson = (s: string) => JSON.stringify(s);
  const sizeKb = fileSize ? (fileSize / 1024).toFixed(1) + " KB" : "";

  /* ─── FORMAT-SPECIFIC EDITOR HTML ─── */
  const editorArea = (() => {
    switch (fileType) {

      case "doc":
        return `
          <div style="background:rgba(0,229,192,0.05);border:1px solid #1A3028;border-radius:10px;padding:8px 16px;font-size:12px;color:#00E5C0;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Editing as rich text — will resend/download as <strong>.html</strong>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
            ${["bold","italic","underline"].map(cmd=>`<button onclick="document.execCommand('${cmd}')" class="tb-btn">${cmd[0].toUpperCase()+cmd.slice(1)}</button>`).join("")}
            <button onclick="document.execCommand('formatBlock',false,'h1')" class="tb-btn">H1</button>
            <button onclick="document.execCommand('formatBlock',false,'h2')" class="tb-btn">H2</button>
            <button onclick="document.execCommand('insertUnorderedList')" class="tb-btn">• List</button>
            <button onclick="(function(){var u=prompt('URL:');if(u)document.execCommand('createLink',false,u)})()" class="tb-btn">Link</button>
          </div>
          <div id="zd-editor" contenteditable="true" spellcheck="true"
            style="padding:40px 48px;max-width:740px;margin:0 auto;font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.9;color:#E8FFF9;outline:none;min-height:calc(100vh - 260px);border-radius:16px;background:rgba(255,255,255,0.015);border:0.5px solid #1A3028;">
          </div>
          <script>document.getElementById('zd-editor').innerHTML = ZD_FILE.content;<\/script>`;

      case "sheet":
        return `
          <div style="display:flex;gap:12px;background:rgba(0,0,0,0.3);padding:10px 16px;border-radius:10px;margin-bottom:14px;align-items:center;border:0.5px solid #1A3028;">
            <span style="color:#00E5C0;font-weight:800;font-size:14px;">f(x)</span>
            <span id="zd-cell-ref" style="color:#5A8070;min-width:36px;font-size:13px;">A1</span>
            <input id="zd-formula-bar" type="text" placeholder="Cell value…"
              style="flex:1;background:none;border:none;outline:none;color:#E8FFF9;font-family:'DM Mono',monospace;font-size:13px;" />
          </div>
          <div style="overflow:auto;border-radius:12px;border:0.5px solid #1A3028;">
            <table id="zd-sheet-table" style="border-collapse:collapse;font-size:13px;font-family:'DM Mono',monospace;min-width:100%;">
              <thead id="zd-col-headers"></thead>
              <tbody id="zd-sheet-body"></tbody>
            </table>
          </div>
          <script>
            (function(){
              var rows = ZD_FILE.content ? JSON.parse(ZD_FILE.content) : [[]];
              var maxCols = rows.reduce(function(m,r){ return Math.max(m, r.length); }, 1);
              var hRow = '<tr><th style="width:40px;background:#0A1A14;border:0.5px solid #1A3028;"></th>';
              for(var c=0;c<maxCols;c++) hRow += '<th style="padding:6px 16px;background:#0A1A14;color:#5A8070;border:0.5px solid #1A3028;font-weight:600;letter-spacing:.06em;font-size:11px;">'+ String.fromCharCode(65+c) +'</th>';
              hRow += '</tr>';
              document.getElementById('zd-col-headers').innerHTML = hRow;
              var html = '';
              rows.forEach(function(r, ri){
                html += '<tr>';
                html += '<td style="padding:4px 8px;text-align:center;background:#0A1A14;color:#5A8070;border:0.5px solid #1A3028;font-size:11px;user-select:none;">'+(ri+1)+'</td>';
                for(var ci=0;ci<maxCols;ci++){
                  var val = (r[ci]!==undefined&&r[ci]!==null)?r[ci]:'';
                  html += '<td contenteditable="true" data-r="'+ri+'" data-c="'+ci+'" onfocus="zdCellFocus(this)" oninput="zdCellInput(this)"'
                    +' style="padding:8px 14px;border:0.5px solid #1A3028;min-width:100px;outline:none;color:#E8FFF9;cursor:text;">'+String(val).replace(/</g,'&lt;')+'</td>';
                }
                html += '</tr>';
              });
              document.getElementById('zd-sheet-body').innerHTML = html;
            })();
            function zdCellFocus(td){
              var r=parseInt(td.dataset.r),c=parseInt(td.dataset.c);
              document.getElementById('zd-cell-ref').textContent=String.fromCharCode(65+c)+(r+1);
              document.getElementById('zd-formula-bar').value=td.innerText;
            }
            function zdCellInput(td){
              document.getElementById('zd-formula-bar').value=td.innerText;
            }
            document.getElementById('zd-formula-bar').addEventListener('input',function(){
              var active=document.querySelector('td[contenteditable]:focus');
              if(active) active.innerText=this.value;
            });
          <\/script>`;

      case "image":
        return `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
            ${["Normal","Grayscale","Sepia","Brighten","Invert","Blur"].map(f=>`<button onclick="zdApplyFilter('${f.toLowerCase()}')" class="tb-btn">${f}</button>`).join("")}
          </div>
          <div style="display:flex;justify-content:center;">
            <div style="border-radius:16px;overflow:hidden;border:0.5px solid #1A3028;">
              <canvas id="zd-img-canvas" style="max-width:100%;height:auto;display:block;"></canvas>
            </div>
          </div>
          <script>
            var _zdCanvas=document.getElementById('zd-img-canvas');
            var _zdCtx=_zdCanvas.getContext('2d');
            var _zdImg=new Image();
            _zdImg.onload=function(){
              _zdCanvas.width=_zdImg.width>900?900:_zdImg.width;
              _zdCanvas.height=Math.round(_zdImg.height/_zdImg.width*_zdCanvas.width);
              _zdCtx.drawImage(_zdImg,0,0,_zdCanvas.width,_zdCanvas.height);
            };
            _zdImg.src=ZD_FILE.content;
            function zdApplyFilter(f){
              if(f==='normal'){_zdCanvas.style.filter='none';_zdCtx.drawImage(_zdImg,0,0,_zdCanvas.width,_zdCanvas.height);return;}
              if(f==='blur'){_zdCanvas.style.filter='blur(4px)';return;}
              _zdCanvas.style.filter='none';
              _zdCtx.drawImage(_zdImg,0,0,_zdCanvas.width,_zdCanvas.height);
              var id=_zdCtx.getImageData(0,0,_zdCanvas.width,_zdCanvas.height),d=id.data;
              for(var i=0;i<d.length;i+=4){
                var r=d[i],g=d[i+1],b=d[i+2];
                if(f==='grayscale'){var v=0.3*r+0.59*g+0.11*b;d[i]=d[i+1]=d[i+2]=v;}
                else if(f==='sepia'){d[i]=Math.min(255,r*.393+g*.769+b*.189);d[i+1]=Math.min(255,r*.349+g*.686+b*.168);d[i+2]=Math.min(255,r*.272+g*.534+b*.131);}
                else if(f==='brighten'){d[i]=Math.min(255,r+40);d[i+1]=Math.min(255,g+40);d[i+2]=Math.min(255,b+40);}
                else if(f==='invert'){d[i]=255-r;d[i+1]=255-g;d[i+2]=255-b;}
              }
              _zdCtx.putImageData(id,0,0);
            }
          <\/script>`;

      case "pdf": {
        const sz = sizeKb || "Unknown size";
        return `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:80px 40px;text-align:center;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00E5C0" stroke-width="1.2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <div>
              <p style="font-size:22px;font-weight:700;color:#E8FFF9;margin-bottom:8px;">${fileName}</p>
              <p style="font-size:14px;color:#5A8070;">${sz}</p>
            </div>
            <p style="font-size:15px;color:#5A8070;max-width:400px;line-height:1.7;">PDF files cannot be edited in the browser.<br>Download and open in your PDF app.</p>
            <a href="${content||'#'}" download="${fileName}"
              style="padding:12px 28px;border-radius:12px;background:rgba(0,229,192,0.15);border:1px solid #00E5C0;color:#00E5C0;font-weight:700;font-size:14px;text-decoration:none;"
              onmouseover="this.style.background='rgba(0,229,192,0.25)'"
              onmouseout="this.style.background='rgba(0,229,192,0.15)'">↓ Download PDF</a>
          </div>`;
      }

      case "code":
        return `
          <div style="display:flex;height:100%;min-height:calc(100vh - 240px);">
            <div id="zd-line-nums" style="width:48px;background:rgba(0,0,0,0.25);padding:16px 0;text-align:center;border-right:0.5px solid #1A3028;flex-shrink:0;color:#3A5848;font-size:11px;font-family:'DM Mono',monospace;line-height:1.7;overflow:hidden;user-select:none;"></div>
            <pre id="zd-editor" contenteditable="true" spellcheck="false" oninput="zdCodeInput()"
              style="flex:1;margin:0;padding:16px 24px;outline:none;white-space:pre;overflow-x:auto;font-family:'DM Mono',monospace;font-size:13px;line-height:1.7;color:#B8D8CF;tab-size:2;background:transparent;border:none;"></pre>
          </div>
          <script>
            var _zdHljsTimer=null;
            var _zdCodeEditor=document.getElementById('zd-editor');
            _zdCodeEditor.textContent=ZD_FILE.content;
            zdUpdateLineNums();
            var hljsScript=document.createElement('script');
            hljsScript.src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
            document.head.appendChild(hljsScript);
            var hljsStyle=document.createElement('link');
            hljsStyle.rel='stylesheet';
            hljsStyle.href='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
            document.head.appendChild(hljsStyle);
            function zdUpdateLineNums(){
              var lines=(_zdCodeEditor.textContent||'').split('\\n');
              document.getElementById('zd-line-nums').innerHTML=lines.map(function(_,i){return '<div>'+(i+1)+'</div>';}).join('');
            }
            function zdCodeInput(){
              zdUpdateLineNums();
              clearTimeout(_zdHljsTimer);
              _zdHljsTimer=setTimeout(function(){
                if(window.hljs){
                  var text=_zdCodeEditor.textContent;
                  var lang=ZD_FILE.name.split('.').pop();
                  try{var res=hljs.highlight(text,{language:lang,ignoreIllegals:true});if(!window.getSelection().toString())_zdCodeEditor.innerHTML=res.value;}catch(e){}
                }
              },600);
            }
          <\/script>`;

      case "text":
        return `
          <textarea id="zd-editor"
            style="width:100%;height:calc(100vh - 240px);min-height:400px;padding:32px 40px;background:rgba(255,255,255,0.013);border:0.5px solid #1A3028;border-radius:16px;outline:none;color:#E8FFF9;font-family:'DM Mono',monospace;font-size:14px;line-height:1.8;resize:none;box-sizing:border-box;">
          </textarea>
          <script>document.getElementById('zd-editor').value=ZD_FILE.content;<\/script>`;

      default: {
        return `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:80px 40px;text-align:center;">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3A5848" stroke-width="1.2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p style="font-size:18px;font-weight:700;color:#E8FFF9;">${fileName}</p>
            ${sizeKb ? `<p style="font-size:13px;color:#3A5848;">${sizeKb}</p>` : ""}
            <p style="font-size:14px;color:#5A8070;">Preview not available for this format.</p>
          </div>`;
      }
    }
  })();

  const xlsxCdn = fileType === "sheet"
    ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"><\/script>`
    : "";

  /* ─────────────── FULL PAGE ─────────────── */
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ZipDrop Editor — ${fileName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
${xlsxCdn}
<script>
var ZD_FILE = { name: ${safeJson(fileName)}, type: ${safeJson(fileType)}, content: ${safeJson(content)} };
<\/script>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#050D0B; --surface:#0A1A14; --border:#1A3028;
    --cyan:#00E5C0; --cyan-dim:rgba(0,229,192,0.08); --text:#E8FFF9;
    --muted:#5A8070; --font-sans:'DM Sans',sans-serif;
    --font-head:'Syne',sans-serif; --font-mono:'DM Mono',monospace;
  }
  html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--text);font-family:var(--font-sans);font-size:14px;}

  /* ── Root layout ── */
  #zd-root{display:flex;flex-direction:column;height:100vh;}
  #zd-topbar{display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:56px;border-bottom:0.5px solid var(--border);flex-shrink:0;background:rgba(5,13,11,.95);backdrop-filter:blur(16px);gap:12px;}
  #zd-body{display:flex;flex:1;overflow:hidden;}
  #zd-main{flex:1;overflow-y:auto;padding:24px;}
  #zd-sidebar{width:212px;flex-shrink:0;border-left:0.5px solid var(--border);overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:28px;}

  /* ── Topbar ── */
  #zd-logo{display:flex;align-items:center;gap:10px;flex-shrink:0;}
  #zd-logo-text{font-family:var(--font-head);font-weight:700;font-size:15px;color:var(--text);}
  #zd-file-badge{padding:4px 12px;border-radius:20px;border:0.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:12px;font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;flex:1;}
  #zd-editable-dot{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--cyan);flex-shrink:0;}
  #zd-editable-dot .dot{width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 10px var(--cyan);animation:pulse 1.8s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  #zd-btn-info{background:none;border:0.5px solid var(--border);color:var(--muted);cursor:pointer;font-size:13px;line-height:1;padding:4px 9px;border-radius:8px;transition:all .2s;font-family:var(--font-sans);}
  #zd-btn-info:hover{color:var(--cyan);border-color:var(--cyan);background:var(--cyan-dim);}
  #zd-btn-close{background:none;border:none;color:var(--muted);cursor:pointer;font-size:22px;line-height:1;padding:4px 8px;border-radius:8px;transition:all .2s;flex-shrink:0;}
  #zd-btn-close:hover{color:var(--text);background:rgba(255,255,255,.05);}

  /* ── Info panel (formats legend) ── */
  #zd-info-panel{flex-shrink:0;overflow:hidden;max-height:0;transition:max-height .35s cubic-bezier(0.4,0,0.2,1);border-bottom:0.5px solid var(--border);background:#08120F;}
  #zd-info-panel.open{max-height:320px;}
  .zd-info-inner{padding:16px 24px;overflow-x:auto;}
  .zd-fmt-table{width:100%;border-collapse:collapse;font-size:12px;}
  .zd-fmt-table th{padding:7px 14px;background:#0D1A16;color:#5A8A7A;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border-bottom:0.5px solid var(--border);text-align:left;}
  .zd-fmt-table td{padding:8px 14px;border-bottom:0.5px solid #0D1A16;color:#A0C8BE;vertical-align:top;}
  .zd-fmt-table tr:last-child td{border-bottom:none;}
  .zd-fmt-ext{font-family:var(--font-mono);color:var(--cyan);}
  .zd-fmt-mode{color:#E8FFF9;}

  /* ── Doc editor toolbar ── */
  .tb-btn{padding:5px 12px;border-radius:8px;border:0.5px solid var(--border);background:var(--surface);color:var(--muted);font-family:var(--font-sans);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;}
  .tb-btn:hover{color:var(--cyan);border-color:var(--cyan);background:var(--cyan-dim);}

  /* ── NEW BOTTOM BAR ── */
  .zd-bottom-bar{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:#08120F;border-top:0.5px solid #1A3028;gap:16px;flex-wrap:wrap;flex-shrink:0;}
  .zd-save-status{display:flex;align-items:center;font-size:12px;color:#5A8A7A;gap:0;min-width:120px;}
  .zd-save-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#3DFFA0;margin-right:7px;box-shadow:0 0 6px #3DFFA0;flex-shrink:0;}
  .zd-bottom-actions{display:flex;align-items:center;gap:8px;}
  .zd-btn-primary{padding:10px 22px;background:#00E5C0;color:#030E10;border:none;border-radius:10px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap;}
  .zd-btn-primary:hover{background:#00FFD6;box-shadow:0 0 16px rgba(0,229,192,0.3);}
  .zd-btn-primary:disabled{opacity:.6;cursor:not-allowed;}
  .zd-btn-secondary{padding:10px 22px;background:transparent;color:#A0C8BE;border:0.5px solid #1A3028;border-radius:10px;font-family:'Syne',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;}
  .zd-btn-secondary:hover{border-color:#00E5C0;color:#00E5C0;}
  .zd-new-code-wrap{display:flex;align-items:center;gap:10px;background:#0D1A16;border:0.5px solid #1A3028;border-radius:12px;padding:8px 16px;}
  .zd-new-code-label{font-size:11px;color:#5A8A7A;white-space:nowrap;}
  .zd-code-digits{display:flex;gap:6px;}
  .zd-code-digit{width:36px;height:40px;background:#050D0B;border:1.5px solid #00E5C0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:20px;font-weight:500;color:#00E5C0;animation:digitPop .3s cubic-bezier(0.34,1.56,0.64,1) both;}
  @keyframes digitPop{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}
  .zd-copy-btn{font-size:11px;color:#00B4E5;background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:underline;white-space:nowrap;}

  /* ── Sidebar ── */
  .sidebar-heading{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;}
  .collab-entry{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
  .avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#000;flex-shrink:0;}
  .peer-name{font-size:13px;font-weight:600;color:var(--text);}
  .peer-status{display:flex;align-items:center;gap:4px;margin-top:2px;}
  .green-dot{width:6px;height:6px;border-radius:50%;background:var(--cyan);box-shadow:0 0 6px var(--cyan);flex-shrink:0;}
  .status-text{font-size:11px;color:var(--muted);}
  .version-entry{padding:10px 12px;border-radius:10px;border:0.5px solid var(--border);margin-bottom:8px;cursor:pointer;transition:all .2s;}
  .version-entry:hover{border-color:var(--cyan);background:var(--cyan-dim);}
  .version-entry.latest{border-left:2px solid var(--cyan);background:rgba(0,229,192,.04);}
  .v-top{display:flex;justify-content:space-between;margin-bottom:2px;}
  .v-tag{font-size:12px;font-weight:700;color:var(--text);}
  .v-tag.latest{color:var(--cyan);}
  .v-time{font-size:10px;color:var(--muted);}
  .v-author{font-size:11px;color:var(--muted);}

  /* ── Misc ── */
  .zd-divider{border:none;border-top:0.5px solid var(--border);margin:0;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  @media(max-width:768px){#zd-sidebar{display:none;}.zd-save-status{display:none;}}
  #zd-editor h1{font-size:28px;font-weight:700;margin:16px 0 8px;color:#E8FFF9;}
  #zd-editor h2{font-size:22px;font-weight:600;margin:14px 0 6px;color:#E8FFF9;}
  #zd-editor p{margin:6px 0;}
  #zd-editor ul{padding-left:24px;margin:6px 0;}
  #zd-editor a{color:var(--cyan);}
</style>
</head>
<body>
<div id="zd-root">

  <!-- TOPBAR -->
  <div id="zd-topbar">
    <div id="zd-logo">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <rect width="30" height="30" rx="8" fill="rgba(0,229,192,0.1)" stroke="#1A3028" stroke-width="0.5"/>
        <path d="M9 10h12M9 15h8M9 20h10" stroke="#00E5C0" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <span id="zd-logo-text">ZipDrop</span>
    </div>
    <span id="zd-file-badge">${fileName}</span>
    <div id="zd-editable-dot"><span class="dot"></span>EDITABLE</div>
    <button id="zd-btn-info" onclick="toggleInfoPanel()" title="Supported formats">ⓘ Formats</button>
    <button id="zd-btn-close" onclick="window.close()" title="Close tab">×</button>
  </div>

  <!-- FORMATS INFO PANEL -->
  <div id="zd-info-panel">
    <div class="zd-info-inner">
      <table class="zd-fmt-table">
        <thead>
          <tr>
            <th>Format</th>
            <th>Extensions</th>
            <th>Edit mode</th>
            <th>Resends as</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Document</td><td class="zd-fmt-ext">.docx .doc .txt .md</td><td class="zd-fmt-mode">Rich text editor</td><td>.html</td></tr>
          <tr><td>Spreadsheet</td><td class="zd-fmt-ext">.xlsx .xls</td><td class="zd-fmt-mode">Editable table grid</td><td>.xlsx / .csv</td></tr>
          <tr><td>Code</td><td class="zd-fmt-ext">.py .js .ts .jsx .tsx .json .html .css</td><td class="zd-fmt-mode">Syntax code editor</td><td>same extension</td></tr>
          <tr><td>Image</td><td class="zd-fmt-ext">.png .jpg .jpeg .webp .gif</td><td class="zd-fmt-mode">Canvas + filters</td><td>.png</td></tr>
          <tr><td>PDF</td><td class="zd-fmt-ext">.pdf</td><td class="zd-fmt-mode">Preview only</td><td>download only</td></tr>
          <tr><td>Other</td><td class="zd-fmt-ext">anything else</td><td class="zd-fmt-mode">Info card</td><td>—</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- BODY -->
  <div id="zd-body">
    <div id="zd-main">${editorArea}</div>
    <div id="zd-sidebar">
      <div>
        <div class="sidebar-heading">Collaborators</div>
        <div id="zd-collab-list"><p style="font-size:11px;color:var(--muted);">Waiting for others…</p></div>
      </div>
      <hr class="zd-divider">
      <div style="flex:1;">
        <div class="sidebar-heading">Version Trail</div>
        <div id="zd-version-list"><p style="font-size:11px;color:var(--muted);text-align:center;margin-top:16px;">Initializing history…</p></div>
      </div>
    </div>
  </div>

  <!-- NEW BOTTOM BAR -->
  <div class="zd-bottom-bar">
    <div class="zd-save-status">
      <span class="zd-save-dot"></span>
      <span id="zd-save-text">All changes saved</span>
    </div>
    <div class="zd-bottom-actions">
      <button id="zd-resend-btn" class="zd-btn-primary" onclick="zdResend()">↗ Resend edited file</button>
      <button id="zd-download-btn" class="zd-btn-secondary" onclick="zdDownload()">↓ Download edited</button>
    </div>
    <div class="zd-new-code-wrap" id="zd-new-code-wrap" style="display:none;">
      <span class="zd-new-code-label">New code for recipient</span>
      <div class="zd-code-digits" id="zd-code-digits"></div>
      <button class="zd-copy-btn" onclick="zdCopyCode()">Copy</button>
    </div>
  </div>

</div>

<!-- ── INFO PANEL TOGGLE ── -->
<script>
function toggleInfoPanel(){
  var panel=document.getElementById('zd-info-panel');
  panel.classList.toggle('open');
  document.getElementById('zd-btn-info').style.color=panel.classList.contains('open')?'#00E5C0':'';
}
<\/script>

<!-- ── COLLABORATORS SIMULATION ── -->
<script>
(function(){
  var names=['Aarav','Riya','Tanvir','Priya','Kabir','Sneha','Arjun','Meera'];
  var colors=['#00E5C0','#00B4E5','#FFB830','#C9A7FF'];
  var statuses=['Editing now','Viewing','Typing…','Selecting text','Idle'];
  var peers=[];
  function rdm(arr){return arr[Math.floor(Math.random()*arr.length)];}
  function addPeer(){var name=rdm(names);peers.push({name:name,initials:name[0],color:rdm(colors),status:'Viewing'});renderPeers();}
  function renderPeers(){
    var list=document.getElementById('zd-collab-list');
    if(!list)return;
    if(peers.length===0){list.innerHTML='<p style="font-size:11px;color:var(--muted);">Waiting for others…</p>';return;}
    list.innerHTML=peers.map(function(p){
      return '<div class="collab-entry"><div class="avatar" style="background:'+p.color+'">'+p.initials+'</div>'
        +'<div><div class="peer-name">'+p.name+'</div>'
        +'<div class="peer-status"><span class="green-dot"></span><span class="status-text">'+p.status+'</span></div></div></div>';
    }).join('');
  }
  setTimeout(function(){addPeer();setTimeout(addPeer,2000);},3000);
  setInterval(function(){peers=peers.map(function(p){return Object.assign({},p,{status:rdm(statuses)});});renderPeers();},5000);
})();
<\/script>

<!-- ── VERSION TRAIL ── -->
<script>
(function(){
  var versions=[],vCount=0,_snapTimer=null;
  function getEditorContent(){
    var ed=document.getElementById('zd-editor');
    if(!ed)return '';
    return ed.tagName==='TEXTAREA'?ed.value:(ed.innerText||ed.textContent||'');
  }
  function timeAgo(ts){
    var m=Math.floor((Date.now()-ts)/60000);
    if(m<1)return 'just now';if(m<60)return m+'m ago';return Math.floor(m/60)+'h ago';
  }
  function renderVersions(){
    var list=document.getElementById('zd-version-list');
    if(!list)return;
    if(versions.length===0){list.innerHTML='<p style="font-size:11px;color:var(--muted);text-align:center;margin-top:16px;">Initializing history…</p>';return;}
    list.innerHTML=versions.map(function(v,i){
      return '<div class="version-entry'+(i===0?' latest':'')+'" onclick="zdRestoreVersion('+i+')">'
        +'<div class="v-top"><span class="v-tag'+(i===0?' latest':'')+'">'+v.tag+'</span><span class="v-time">'+timeAgo(v.time)+'</span></div>'
        +'<div class="v-author">'+v.author+'</div></div>';
    }).join('');
  }
  window.zdRestoreVersion=function(idx){
    var v=versions[idx];if(!v)return;
    var ed=document.getElementById('zd-editor');if(!ed)return;
    if(ed.tagName==='TEXTAREA')ed.value=v.content;else ed.innerHTML=v.content;
  };
  function scheduleSnap(){
    clearTimeout(_snapTimer);
    _snapTimer=setTimeout(function(){
      vCount++;
      versions.unshift({tag:'v'+vCount,author:'You',time:Date.now(),content:getEditorContent()});
      if(versions.length>8)versions=versions.slice(0,8);
      renderVersions();
    },8000);
  }
  setTimeout(function(){
    var ed=document.getElementById('zd-editor');
    if(ed)ed.addEventListener('input',scheduleSnap);
    setTimeout(scheduleSnap,5000);
  },500);
})();
<\/script>

<!-- ── AUTOSAVE TICKER ── -->
<script>
(function(){
  var msgs=['All changes saved','Autosaving…','Synced locally ✓','All changes saved'];
  var i=0;
  setInterval(function(){
    i=(i+1)%msgs.length;
    var el=document.getElementById('zd-save-text');
    if(el)el.textContent=msgs[i];
  },4000);
})();
<\/script>

<!-- ── BLOB CREATION + RESEND + DOWNLOAD ── -->
<script>
var _zdLastCode=null;

/* Returns Promise<{blob, filename}> */
function getEditedBlob(){
  var ft=ZD_FILE.type, fn=ZD_FILE.name;
  if(ft==='doc'){
    var el=document.getElementById('zd-editor');
    var html=el?el.innerHTML:'';
    var full='<html><body style="font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.8">'+html+'</body></html>';
    return Promise.resolve({blob:new Blob([full],{type:'text/html'}),filename:fn.replace(/\.[^.]+$/,'_edited.html')});
  }
  if(ft==='sheet'){
    var rows=[];
    document.querySelectorAll('#zd-sheet-body tr').forEach(function(tr){
      var row=[];
      tr.querySelectorAll('td[contenteditable]').forEach(function(td){row.push(td.innerText);});
      if(row.length)rows.push(row);
    });
    if(window.XLSX){
      var wb=XLSX.utils.book_new();
      var ws=XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb,ws,'Sheet1');
      var buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
      return Promise.resolve({blob:new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),filename:fn.replace(/\.[^.]+$/,'_edited.xlsx')});
    }
    var csv=rows.map(function(r){return r.join(',');}).join('\\n');
    return Promise.resolve({blob:new Blob([csv],{type:'text/csv'}),filename:fn.replace(/\.[^.]+$/,'_edited.csv')});
  }
  if(ft==='code'||ft==='text'){
    var ed=document.getElementById('zd-editor');
    var text=ed?(ed.tagName==='TEXTAREA'?ed.value:ed.textContent):'';
    var ext=fn.split('.').pop();
    return Promise.resolve({blob:new Blob([text],{type:'text/plain'}),filename:fn.replace(/\.[^.]+$/,'_edited.'+ext)});
  }
  if(ft==='image'){
    return new Promise(function(resolve){
      var canvas=document.getElementById('zd-img-canvas');
      canvas.toBlob(function(blob){resolve({blob:blob,filename:fn.replace(/\.[^.]+$/,'_edited.png')});
      },'image/png');
    });
  }
  return Promise.reject(new Error('Format cannot be edited.'));
}

function zdShowCode(code){
  _zdLastCode=code;
  var wrap=document.getElementById('zd-new-code-wrap');
  var digitsEl=document.getElementById('zd-code-digits');
  digitsEl.innerHTML='';
  wrap.style.display='flex';
  code.split('').forEach(function(d,i){
    setTimeout(function(){
      var div=document.createElement('div');
      div.className='zd-code-digit';
      div.style.animationDelay=i*80+'ms';
      div.textContent=d;
      digitsEl.appendChild(div);
    },i*80);
  });
}

function zdResend(){
  var btn=document.getElementById('zd-resend-btn');
  if(btn.disabled)return;
  btn.disabled=true;
  btn.textContent='Sending…';
  getEditedBlob().then(function(result){
    var code=Math.floor(1000+Math.random()*9000).toString();
    try{
      if(window.opener){
        window.opener.zdDropStore=window.opener.zdDropStore||new Map();
        window.opener.zdDropStore.set(code,{blob:result.blob,filename:result.filename,fileType:ZD_FILE.type});
      } else {
        localStorage.setItem('zdDrop_'+code,'pending');
      }
    }catch(e){}
    zdShowCode(code);
    btn.textContent='✓ Sent';
    btn.style.background='#1A6B50';
    var saveEl=document.getElementById('zd-save-text');
    if(saveEl)saveEl.textContent='Shared! Recipient uses code '+code;
  }).catch(function(e){
    btn.disabled=false;
    btn.textContent='↗ Resend edited file';
    alert('Could not collect edited content: '+e.message);
  });
}

function zdDownload(){
  var btn=document.getElementById('zd-download-btn');
  btn.textContent='Preparing…';
  btn.style.pointerEvents='none';
  getEditedBlob().then(function(result){
    var url=URL.createObjectURL(result.blob);
    var a=document.createElement('a');
    a.href=url;a.download=result.filename;a.click();
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
    btn.textContent='✓ Downloaded';
    btn.style.color='#00E5C0';
    setTimeout(function(){btn.textContent='↓ Download edited';btn.style.color='';btn.style.pointerEvents='';},2500);
  }).catch(function(e){
    btn.textContent='↓ Download edited';btn.style.pointerEvents='';
    alert('Download failed: '+e.message);
  });
}

function zdCopyCode(){
  if(!_zdLastCode)return;
  navigator.clipboard.writeText(_zdLastCode).catch(function(){});
  var btn=event.target;
  btn.textContent='Copied!';
  setTimeout(function(){btn.textContent='Copy';},1800);
}
<\/script>

</body>
</html>`;
}
