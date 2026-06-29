export function buildEditorPage(
  fileName: string,
  fileType: string,
  content: string,
  fileSize?: number,
  recipientCode?: string
): string {
  const safeJson = (s: string) => JSON.stringify(s);
  const sizeKb = fileSize ? (fileSize / 1024).toFixed(1) + " KB" : "";
  const isPdf = fileType === "pdf";

  const editorArea = (() => {
    switch (fileType) {
      case "sheet":
        return `<div style="display:flex;gap:12px;background:#F5F4F0;padding:10px 16px;border-radius:8px;margin-bottom:14px;align-items:center;border:1px solid #E0DED8;"><span style="color:#00C49A;font-weight:800;font-size:14px;">f(x)</span><span id="zd-cell-ref" style="color:#6B6B6B;min-width:36px;font-size:13px;">A1</span><input id="zd-formula-bar" type="text" placeholder="Cell value\u2026" style="flex:1;background:none;border:none;outline:none;color:#1A1A1A;font-family:monospace;font-size:13px;" /></div><div style="overflow:auto;border-radius:8px;border:1px solid #E0DED8;"><table id="zd-sheet-table" style="border-collapse:collapse;font-size:13px;font-family:monospace;min-width:100%;"><thead id="zd-col-headers"></thead><tbody id="zd-sheet-body"></tbody></table></div><script>(function(){var rows=ZD_FILE.content?JSON.parse(ZD_FILE.content):[[]];var maxCols=rows.reduce(function(m,r){return Math.max(m,r.length);},1);var hRow='<tr><th style="width:40px;background:#F5F4F0;border:1px solid #E0DED8;"></th>';for(var c=0;c<maxCols;c++)hRow+='<th style="padding:6px 16px;background:#F5F4F0;color:#6B6B6B;border:1px solid #E0DED8;font-weight:600;font-size:11px;">'+String.fromCharCode(65+c)+'</th>';hRow+='</tr>';document.getElementById('zd-col-headers').innerHTML=hRow;var html='';rows.forEach(function(r,ri){html+='<tr>';html+='<td style="padding:4px 8px;text-align:center;background:#F5F4F0;color:#6B6B6B;border:1px solid #E0DED8;font-size:11px;user-select:none;">'+(ri+1)+'</td>';for(var ci=0;ci<maxCols;ci++){var val=(r[ci]!==undefined&&r[ci]!==null)?r[ci]:'';html+='<td contenteditable="true" data-r="'+ri+'" data-c="'+ci+'" onfocus="zdCellFocus(this)" oninput="zdCellInput(this)" style="padding:8px 14px;border:1px solid #E0DED8;min-width:100px;outline:none;color:#1A1A1A;cursor:text;">'+String(val).replace(/</g,'&lt;')+'</td>';}html+='</tr>';});document.getElementById('zd-sheet-body').innerHTML=html;})();function zdCellFocus(td){var r=parseInt(td.dataset.r),c=parseInt(td.dataset.c);document.getElementById('zd-cell-ref').textContent=String.fromCharCode(65+c)+(r+1);document.getElementById('zd-formula-bar').value=td.innerText;}function zdCellInput(td){document.getElementById('zd-formula-bar').value=td.innerText;}document.getElementById('zd-formula-bar').addEventListener('input',function(){var active=document.querySelector('td[contenteditable]:focus');if(active)active.innerText=this.value;});<\/script>`;
      case "image":
        return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">${["Normal","Grayscale","Sepia","Brighten","Invert","Blur"].map(function(f){return '<button onclick="zdApplyFilter(\''+f.toLowerCase()+'\')" class="tb-btn">'+f+'</button>';}).join("")}</div><div style="display:flex;justify-content:center;"><div style="border-radius:8px;overflow:hidden;border:1px solid #E0DED8;"><canvas id="zd-img-canvas" style="max-width:100%;height:auto;display:block;"></canvas></div></div><script>var _zdCanvas=document.getElementById('zd-img-canvas');var _zdCtx=_zdCanvas.getContext('2d');var _zdImg=new Image();_zdImg.onload=function(){_zdCanvas.width=_zdImg.width>900?900:_zdImg.width;_zdCanvas.height=Math.round(_zdImg.height/_zdImg.width*_zdCanvas.width);_zdCtx.drawImage(_zdImg,0,0,_zdCanvas.width,_zdCanvas.height);};_zdImg.src=ZD_FILE.content;function zdApplyFilter(f){if(f==='normal'){_zdCanvas.style.filter='none';_zdCtx.drawImage(_zdImg,0,0,_zdCanvas.width,_zdCanvas.height);return;}if(f==='blur'){_zdCanvas.style.filter='blur(4px)';return;}_zdCanvas.style.filter='none';_zdCtx.drawImage(_zdImg,0,0,_zdCanvas.width,_zdCanvas.height);var id=_zdCtx.getImageData(0,0,_zdCanvas.width,_zdCanvas.height),d=id.data;for(var i=0;i<d.length;i+=4){var r=d[i],g=d[i+1],b=d[i+2];if(f==='grayscale'){var v=0.3*r+0.59*g+0.11*b;d[i]=d[i+1]=d[i+2]=v;}else if(f==='sepia'){d[i]=Math.min(255,r*.393+g*.769+b*.189);d[i+1]=Math.min(255,r*.349+g*.686+b*.168);d[i+2]=Math.min(255,r*.272+g*.534+b*.131);}else if(f==='brighten'){d[i]=Math.min(255,r+40);d[i+1]=Math.min(255,g+40);d[i+2]=Math.min(255,b+40);}else if(f==='invert'){d[i]=255-r;d[i+1]=255-g;d[i+2]=255-b;}}_zdCtx.putImageData(id,0,0);}<\/script>`;
      case "pdf":
        return `<div id="zd-pdf-container" style="max-width:816px;margin:0 auto;"></div><script>if(ZD_FILE.content&&ZD_FILE.content.indexOf('data:')===0){var _pdfB64=ZD_FILE.content.split(',')[1];var _pdfBin=atob(_pdfB64);var _pdfArr=new Uint8Array(_pdfBin.length);for(var _i=0;_i<_pdfBin.length;_i++)_pdfArr[_i]=_pdfBin.charCodeAt(_i);var _pdfjsLib=window.opener&&window.opener.__zdEditorLibs&&window.opener.__zdEditorLibs.pdfjsLib;if(_pdfjsLib){_pdfjsLib.GlobalWorkerOptions.workerSrc=window.location.origin+'/pdf.worker.min.js';setTimeout(function(){renderPDF(_pdfArr.buffer);},100);}else{document.getElementById('zd-pdf-container').innerHTML='<embed src="'+ZD_FILE.content+'" type="application/pdf" style="width:100%;height:80vh;border-radius:8px;border:1px solid #E0DED8;">';}}<\/script>`;
      case "code":
        return `<div style="display:flex;height:100%;min-height:calc(100vh - 240px);"><div id="zd-line-nums" style="width:48px;background:#F5F4F0;padding:16px 0;text-align:center;border-right:1px solid #E0DED8;flex-shrink:0;color:#6B6B6B;font-size:11px;font-family:monospace;line-height:1.7;overflow:hidden;user-select:none;"></div><pre id="zd-editor" contenteditable="true" spellcheck="false" oninput="zdCodeInput()" style="flex:1;margin:0;padding:16px 24px;outline:none;white-space:pre;overflow-x:auto;font-family:monospace;font-size:13px;line-height:1.7;color:#1A1A1A;tab-size:2;background:transparent;border:none;"></pre></div><script>var _zdHljsTimer=null;var _zdCodeEditor=document.getElementById('zd-editor');_zdCodeEditor.textContent=ZD_FILE.content;zdUpdateLineNums();var hljs=(window.opener&&window.opener.__zdEditorLibs&&window.opener.__zdEditorLibs.hljs)||null;function zdUpdateLineNums(){var lines=(_zdCodeEditor.textContent||'').split('\\n');document.getElementById('zd-line-nums').innerHTML=lines.map(function(_,i){return '<div>'+(i+1)+'</div>';}).join('');}function zdCodeInput(){zdUpdateLineNums();clearTimeout(_zdHljsTimer);_zdHljsTimer=setTimeout(function(){if(hljs){var text=_zdCodeEditor.textContent;var lang=ZD_FILE.name.split('.').pop();try{var res=hljs.highlight(text,{language:lang,ignoreIllegals:true});if(!window.getSelection().toString())_zdCodeEditor.innerHTML=res.value;}catch(e){}}},600);}<\/script>`;
      case "text":
        return `<textarea id="zd-editor" style="width:100%;height:calc(100vh - 240px);min-height:400px;padding:32px 40px;background:#fff;border:1px solid #E0DED8;border-radius:8px;outline:none;color:#1A1A1A;font-family:monospace;font-size:14px;line-height:1.8;resize:none;box-sizing:border-box;"></textarea><script>document.getElementById('zd-editor').value=ZD_FILE.content;<\/script>`;
      default:
        return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:80px 40px;text-align:center;"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" stroke-width="1.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p style="font-size:18px;font-weight:700;color:#1A1A1A;margin-bottom:8px;">${fileName}</p>${sizeKb?'<p style="font-size:13px;color:#6B6B6B;">'+sizeKb+'</p>':''}<p style="font-size:14px;color:#6B6B6B;">Preview not available for this format.</p></div>`;
    }
  })();

  const showToolbar = isPdf;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ZipDrop Editor — ${fileName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg-app:#F2F1ED;--bg-surface:#FFF;--bg-topbar:#FFF;--accent:#00C49A;--accent-hover:#00B08A;--text-primary:#1A1A1A;--text-muted:#6B6B6B;--border:#E0DED8;--radius:8px;--font-mono:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;--shadow:0 1px 4px rgba(0,0,0,0.06)}
html,body{height:100%;background:var(--bg-app);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;color:var(--text-primary);-webkit-font-smoothing:antialiased}
#zd-root{display:flex;flex-direction:column;height:100vh;overflow:hidden}
#zd-topbar{display:flex;align-items:center;gap:12px;height:48px;padding:0 16px;background:var(--bg-topbar);border-bottom:1px solid var(--border);flex-shrink:0}
#zd-logo{display:flex;align-items:center;gap:8px}
#zd-logo-text{font-weight:700;font-size:15px;color:var(--text-primary)}
#zd-filename{flex:1;border:none;background:transparent;font-size:13px;color:var(--text-primary);outline:none;padding:4px 8px;border-radius:4px;max-width:300px}
#zd-filename:focus{background:#F5F4F0}
.zd-badge{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding:2px 8px;border-radius:4px;background:rgba(0,196,154,0.1);color:var(--accent);border:1px solid rgba(0,196,154,0.2)}
.zd-icon-btn{width:32px;height:32px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:18px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;transition:all .15s}
.zd-icon-btn:hover{background:#F0EFEA;color:var(--text-primary)}
#zd-info-panel{display:none;position:absolute;top:56px;left:16px;z-index:100;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 30px rgba(0,0,0,0.12);min-width:480px;padding:20px}
#zd-info-panel.open{display:block}
.zd-info-inner{overflow-x:auto}
.zd-fmt-table{width:100%;border-collapse:collapse;font-size:12px}
.zd-fmt-table th{text-align:left;padding:8px 12px;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--border);text-transform:uppercase;font-size:10px;letter-spacing:.5px}
.zd-fmt-table td{padding:8px 12px;border-bottom:1px solid #F0EFEA;color:var(--text-primary)}
.zd-fmt-ext{font-family:var(--font-mono);font-size:11px;color:var(--text-muted)}
#zd-toolbar{display:flex;align-items:center;gap:4px;height:40px;padding:0 12px;background:var(--bg-surface);border-bottom:1px solid var(--border);flex-shrink:0}
.tb-group{display:flex;align-items:center;gap:2px}
.tb-select{background:#F5F4F0;border:1px solid var(--border);border-radius:4px;padding:2px 4px;font-size:11px;color:var(--text-primary);outline:none;height:26px}
.tb-btn{display:inline-flex;align-items:center;justify-content:center;height:28px;min-width:28px;padding:0 6px;border:none;background:transparent;border-radius:4px;cursor:pointer;font-size:12px;color:var(--text-primary);transition:all .12s}
.tb-btn:hover{background:#F0EFEA}
.tb-btn.active{background:rgba(0,196,154,0.12);color:var(--accent)}
.tb-btn.pill{font-size:10px;font-weight:700;padding:0 8px}
.tb-divider{width:1px;height:20px;background:var(--border);margin:0 4px}
.zd-zoom{display:flex;align-items:center;gap:4px;margin-left:auto}
.zd-zoom button{width:24px;height:24px;border:none;background:transparent;border-radius:4px;cursor:pointer;font-size:14px;color:var(--text-muted);display:flex;align-items:center;justify-content:center}
.zd-zoom button:hover{background:#F0EFEA}
#zd-zoom-level{font-size:11px;color:var(--text-muted);min-width:36px;text-align:center;font-variant-numeric:tabular-nums}
#zd-body{display:flex;flex:1;overflow:hidden}
#zd-thumb-strip{width:80px;flex-shrink:0;background:var(--bg-surface);border-right:1px solid var(--border);overflow-y:auto;padding:8px 6px}
.zd-thumb-page{width:64px;height:48px;margin:0 auto 8px;background:#F5F4F0;border:2px solid transparent;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-muted);transition:all .12s}
.zd-thumb-page.active{border-color:var(--accent);background:rgba(0,196,154,0.06);color:var(--text-primary);font-weight:600}
.zd-thumb-page:hover{border-color:var(--border)}
#zd-main{display:flex;flex-direction:column;align-items:center;flex:1;overflow-y:auto;padding:32px 16px;background:var(--bg-app)}
#page-wrapper{width:816px;max-width:100%;min-height:1056px;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,0.10);border-radius:2px;padding:72px 96px}
#zd-sidebar{width:240px;flex-shrink:0;background:var(--bg-surface);border-left:1px solid var(--border);overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:4px}
.sidebar-heading{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--text-muted);margin-bottom:10px}
.zd-divider{border:none;border-top:1px solid var(--border);margin:12px 0}
#zd-version-list{display:flex;flex-direction:column;gap:2px}
.shimmer{height:14px;background:linear-gradient(90deg,#F0EFEA 25%,#F8F7F4 50%,#F0EFEA 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:4px;margin-bottom:6px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.version-entry{padding:8px 10px;border-radius:6px;cursor:pointer;transition:all .12s}
.version-entry:hover{background:#F5F4F0}
.version-entry.latest{background:rgba(0,196,154,0.06);border-left:2px solid var(--accent)}
.v-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.v-tag{font-size:10px;font-weight:700;padding:1px 6px;border-radius:3px;background:#F0EFEA;color:var(--text-muted)}
.v-tag.latest{background:var(--accent);color:#fff}
.v-time{font-size:10px;color:var(--text-muted)}
.v-author{font-size:11px;color:var(--text-primary);margin-top:2px}
.zd-status-bar{display:flex;align-items:center;justify-content:space-between;height:40px;padding:0 16px;background:var(--bg-surface);border-top:1px solid var(--border);flex-shrink:0}
.zd-status-left{display:flex;align-items:center;gap:8px}
.zd-status-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);display:inline-block}
#zd-save-text{font-size:11px;color:var(--text-muted)}
.zd-status-actions{display:flex;gap:8px}
.zd-btn-primary{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s}
.zd-btn-primary:hover{background:var(--accent-hover)}
.zd-btn-primary:disabled{opacity:.6;cursor:not-allowed}
.zd-btn-secondary{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:transparent;color:var(--text-primary);border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;transition:all .15s}
.zd-btn-secondary:hover{background:#F5F4F0}
.zd-modal-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.35);z-index:1000;align-items:center;justify-content:center}
.zd-modal-overlay.open{display:flex}
.zd-modal{background:var(--bg-surface);border-radius:12px;padding:24px;min-width:360px;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
.zd-modal h3{font-size:16px;font-weight:700;margin-bottom:16px}
.zd-modal label{display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px}
.zd-modal input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:20px;font-weight:700;letter-spacing:8px;text-align:center;outline:none;color:var(--text-primary);background:var(--bg-app)}
.zd-modal input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,196,154,0.1)}
.zd-modal-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
.zd-toast{display:none;position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 24px;border-radius:8px;font-size:13px;z-index:2000;box-shadow:0 4px 16px rgba(0,0,0,0.2)}
#zd-doc-canvas{width:100%}
.zd-pdf-tool-btn{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 10px;border:none;background:transparent;border-radius:4px;cursor:pointer;font-size:11px;color:var(--text-primary);transition:all .12s}
.zd-pdf-tool-btn:hover{background:#F0EFEA}
.zd-pdf-tool-btn.active{background:rgba(0,196,154,0.12);color:var(--accent);font-weight:600}
#zd-pdf-container{width:100%}
</style>
<script>var ZD_FILE={name:${safeJson(fileName)},type:${safeJson(fileType)},content:${safeJson(content)}};<\/script>
</head>
<body>
<div id="zd-root">

<div id="zd-topbar">
  <div id="zd-logo">
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect width="26" height="26" rx="6" fill="#00C49A"/>
      <path d="M8 9h10M8 13h7M8 17h8" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span id="zd-logo-text">ZipDrop</span>
  </div>
  <input id="zd-filename" value="${fileName}" readonly onfocus="this.readOnly=false;this.select()" onblur="this.readOnly=true" spellcheck="false" />
  <span class="zd-badge">EDITABLE</span>
  <button class="zd-icon-btn" id="zd-btn-formats" onclick="toggleInfoPanel()" title="Supported formats">\u24D8</button>
  <button class="zd-icon-btn" onclick="window.close()" title="Close tab">\u00D7</button>
</div>

<div id="zd-info-panel" class="zd-info-panel">
  <div class="zd-info-inner">
    <table class="zd-fmt-table">
      <thead><tr><th>Format</th><th>Extensions</th><th>Edit mode</th><th>Resends as</th></tr></thead>
      <tbody>
        <tr><td>Document</td><td class="zd-fmt-ext">.docx .doc .txt .md</td><td>Rich text editor</td><td>.docx</td></tr>
        <tr><td>Spreadsheet</td><td class="zd-fmt-ext">.xlsx .xls</td><td>Editable table grid</td><td>.xlsx / .csv</td></tr>
        <tr><td>Code</td><td class="zd-fmt-ext">.py .js .ts .jsx .tsx .json .html .css</td><td>Syntax code editor</td><td>same extension</td></tr>
        <tr><td>Image</td><td class="zd-fmt-ext">.png .jpg .jpeg .webp .gif</td><td>Canvas + filters</td><td>.png</td></tr>
        <tr><td>PDF</td><td class="zd-fmt-ext">.pdf</td><td>Inline viewer + annotations</td><td>.pdf</td></tr>
        <tr><td>Other</td><td class="zd-fmt-ext">anything else</td><td>Info card</td><td>\u2014</td></tr>
      </tbody>
    </table>
  </div>
</div>

${showToolbar ? `<div id="zd-toolbar">${isPdf ? `
<div class="tb-group">
  <button id="zd-pdf-tool-text" class="zd-pdf-tool-btn active" onclick="setPdfTool('text')">\u270E Add Text</button>
  <button id="zd-pdf-tool-highlight" class="zd-pdf-tool-btn" onclick="setPdfTool('highlight')">\uD83D\uDCCD Highlight</button>
  <button id="zd-pdf-tool-comment" class="zd-pdf-tool-btn" onclick="setPdfTool('comment')">\uD83D\uDCAC Comment</button>
</div>
<div class="tb-divider"></div>
<div class="tb-group">
  <button class="zd-pdf-tool-btn" onclick="pdfPrevPage()">\u25C0</button>
  <span id="zd-pdf-page-info" style="font-size:11px;color:var(--text-muted);min-width:50px;text-align:center;">1/1</span>
  <button class="zd-pdf-tool-btn" onclick="pdfNextPage()">\u25B6</button>
</div>
` : ''}
<div class="zd-zoom">
  <button onclick="zoomOut()">\u2212</button>
  <span id="zd-zoom-level">100%</span>
  <button onclick="zoomIn()">+</button>
</div>
</div>` : ''}

<div id="zd-body">
  <div id="zd-thumb-strip"></div>
  <div id="zd-main">${editorArea}</div>
  <div id="zd-sidebar">
    <div>
      <div class="sidebar-heading">Collaborators</div>
      <p style="font-size:11px;color:var(--text-muted);line-height:1.5;">Only you are here</p>
    </div>
    <hr class="zd-divider">
    <div style="flex:1;">
      <div class="sidebar-heading">Version Trail</div>
      <div id="zd-version-list">
        <div class="shimmer"></div><div class="shimmer" style="width:80%;"></div><div class="shimmer" style="width:60%;"></div>
      </div>
    </div>
  </div>
</div>

<div class="zd-status-bar">
  <div class="zd-status-left">
    <span class="zd-status-dot"></span>
    <span id="zd-save-text">Synced \u2713</span>
  </div>
  <div class="zd-status-actions">
    <button id="zd-resend-btn" class="zd-btn-primary" onclick="zdOpenResendModal()">\u2191 Resend edited file</button>
    <button id="zd-download-btn" class="zd-btn-secondary" onclick="zdDownload()">\u2193 Download edited</button>
  </div>
</div>

</div>

<div class="zd-modal-overlay" id="zd-resend-modal">
  <div class="zd-modal">
    <h3>\u2191 Resend File</h3>
    <div style="margin-bottom:16px;">
      <label>Recipient Code</label>
      <input id="zd-resend-code" type="text" maxlength="4" inputmode="numeric" pattern="[0-9]*" value="${recipientCode || ''}" />
    </div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">
      Will send as: <span id="zd-resend-filename" style="font-family:var(--font-mono);color:var(--text-primary);font-weight:600;"></span>
    </div>
    <div class="zd-modal-foot">
      <button onclick="zdCloseResendModal()" style="padding:10px 20px;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:13px;">Cancel</button>
      <button id="zd-resend-send-btn" onclick="zdConfirmResend()" style="padding:10px 20px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">\u2191 Send</button>
    </div>
  </div>
</div>

<div id="zd-toast" class="zd-toast"></div>

<script>
(function(){
  var L = window.opener && window.opener.__zdEditorLibs;
  if(L){
    if(L.mammoth) window.mammoth = L.mammoth;
    if(L.htmlDocx) window.htmlDocx = L.htmlDocx;
    if(L.pdfjsLib) window.pdfjsLib = L.pdfjsLib;
    if(L.PDFLib) window.PDFLib = L.PDFLib;
    if(L.XLSX) window.XLSX = L.XLSX;
    if(L.hljs) window.hljs = L.hljs;
    if(L.pdfWorkerUrl && window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = L.pdfWorkerUrl;
  }
})();
<\/script>

<script>
function toggleInfoPanel(){
  var p=document.getElementById('zd-info-panel');
  p.classList.toggle('open');
}
function zdToast(msg){var t=document.getElementById('zd-toast');t.textContent=msg;t.style.display='block';setTimeout(function(){t.style.display='none';},3000);}
function execCmd(cmd,val){document.execCommand(cmd,false,val||null);document.getElementById('zd-editor').focus();}
var _zoomLevel=100;
function zoomIn(){_zoomLevel=Math.min(200,_zoomLevel+10);updateZoom();}
function zoomOut(){_zoomLevel=Math.max(50,_zoomLevel-10);updateZoom();}
function updateZoom(){document.getElementById('zd-zoom-level').textContent=_zoomLevel+'%';var c=document.getElementById('zd-doc-canvas')||document.getElementById('zd-pdf-container');if(c)c.style.transform='scale('+(_zoomLevel/100)+')';c.style.transformOrigin='top center';}
<\/script>




<script>
(function(){
  var versions=[],vCount=0,_snapTimer=null;
  var skeletonDone=false;
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
    if(!skeletonDone){skeletonDone=true;}
    if(versions.length===0){list.innerHTML='<p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:16px;">No versions yet</p>';return;}
    list.innerHTML=versions.map(function(v,i){
      var d=new Date(v.time);
      var dateStr=(d.getMonth()+1)+'/'+d.getDate()+' '+d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
      return '<div class="version-entry'+(i===0?' latest':'')+'" onclick="zdRestoreVersion('+i+')">'
        +'<div class="v-top"><span class="v-tag'+(i===0?' latest':'')+'">'+v.tag+'</span><span class="v-time">'+dateStr+'</span></div>'
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
    setTimeout(function(){if(versions.length===0&&skeletonDone){var list=document.getElementById('zd-version-list');if(list)list.innerHTML='<p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:16px;">No versions yet</p>';}},7000);
  },500);
})();
<\/script>

<script>
(function(){
  var msgs=['Synced \u2713','Autosaving\u2026','Synced \u2713','All changes saved'];
  var i=0;
  setInterval(function(){
    i=(i+1)%msgs.length;
    var el=document.getElementById('zd-save-text');
    if(el)el.textContent=msgs[i];
  },4000);
})();
<\/script>

<script>
var _zdLastCode=null;
var _zdOriginalPdfBytes=null;

function getEditedBlob(){
  var ft=ZD_FILE.type, fn=ZD_FILE.name;
  if(ft==='doc'){
    var el=document.getElementById('zd-editor');
    var html=el?el.innerHTML:'';
    var fullHtml='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>';
    if(window.htmlDocx&&htmlDocx.asBlob){
      var docxBlob=htmlDocx.asBlob(fullHtml,{orientation:'portrait',margins:{top:720,right:1080,bottom:720,left:1080}});
      return Promise.resolve({blob:docxBlob,filename:fn.replace(/\\.[^.]+$/,'')+'_edited.docx'});
    }
    var origin=(window.opener&&window.opener.location)?window.opener.location.origin:window.location.origin;
    return new Promise(function(resolve,reject){
      var s=document.createElement('script');
      s.src=origin+'/html-docx.js';
      s.onload=function(){
        var docxBlob=htmlDocx.asBlob(fullHtml,{orientation:'portrait',margins:{top:720,right:1080,bottom:720,left:1080}});
        resolve({blob:docxBlob,filename:fn.replace(/\\.[^.]+$/,'')+'_edited.docx'});
      };
      s.onerror=function(){reject(new Error('DOCX library not loaded.'));};
      document.head.appendChild(s);
    });
  }
  if(ft==='pdf'){
    if(window.PDFLib) return exportAnnotatedPDF();
    var origin=(window.opener&&window.opener.location)?window.opener.location.origin:window.location.origin;
    return new Promise(function(resolve,reject){
      var s=document.createElement('script');
      s.src=origin+'/pdf-lib.min.js';
      s.onload=function(){ exportAnnotatedPDF().then(resolve,reject); };
      s.onerror=function(){ reject(new Error('PDF library not loaded.')); };
      document.head.appendChild(s);
    });
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
      return Promise.resolve({blob:new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),filename:fn.replace(/\\.[^.]+$/,'')+'_edited.xlsx'});
    }
    var csv=rows.map(function(r){return r.join(',');}).join('\\n');
    return Promise.resolve({blob:new Blob([csv],{type:'text/csv'}),filename:fn.replace(/\\.[^.]+$/,'')+'_edited.csv'});
  }
  if(ft==='code'||ft==='text'){
    var ed=document.getElementById('zd-editor');
    var text=ed?(ed.tagName==='TEXTAREA'?ed.value:ed.textContent):'';
    var ext=fn.split('.').pop();
    return Promise.resolve({blob:new Blob([text],{type:'text/plain'}),filename:fn.replace(/\\.[^.]+$/,'')+'_edited.'+ext});
  }
  if(ft==='image'){
    return new Promise(function(resolve){
      var canvas=document.getElementById('zd-img-canvas');
      canvas.toBlob(function(blob){resolve({blob:blob,filename:fn.replace(/\\.[^.]+$/,'')+'_edited.png'});},'image/png');
    });
  }
  return Promise.reject(new Error('Format cannot be edited.'));
}

function zdOpenResendModal(){
  var el=document.getElementById('zd-resend-modal');
  if(!el)return;
  el.classList.add('open');
  el.style.display='flex';
  var fnEl=document.getElementById('zd-resend-filename');
  if(fnEl)fnEl.textContent=ZD_FILE.name.replace(/\\.[^.]+$/,'')+'_edited.'+(ZD_FILE.type==='doc'?'docx':ZD_FILE.type==='pdf'?'pdf':ZD_FILE.type==='sheet'?'xlsx':ZD_FILE.type==='image'?'png':ZD_FILE.name.split('.').pop());
  var codeEl=document.getElementById('zd-resend-code');
  if(codeEl&&!codeEl.value)codeEl.value=Math.floor(1000+Math.random()*9000).toString();
  if(codeEl){setTimeout(function(){codeEl.focus();codeEl.select();},100);}
}

function zdCloseResendModal(){
  var el=document.getElementById('zd-resend-modal');
  if(el){el.classList.remove('open');el.style.display='none';}
}

function zdConfirmResend(){
  var code=document.getElementById('zd-resend-code');
  if(!code||code.value.length!==4||!/^\\d{4}$/.test(code.value)){
    alert('Please enter a valid 4-digit code.');
    return;
  }
  var btn=document.getElementById('zd-resend-send-btn');
  if(btn.disabled)return;
  btn.disabled=true;btn.textContent='Sending\u2026';
  getEditedBlob().then(function(result){
    var fd=new FormData();
    var blob=result.blob;
    var ext=result.filename.split('.').pop();
    var mime=ext==='pdf'?'application/pdf':ext==='docx'?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':ext==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':ext==='png'?'image/png':'application/octet-stream';
    if(blob.type!==mime) blob=new Blob([blob],{type:mime});
    fd.append('file',blob,result.filename);
    fd.append('recipientCode',code.value);
    return fetch('/api/send',{method:'POST',body:fd});
  }).then(function(res){
    if(!res.ok)throw new Error('HTTP '+res.status);
    zdCloseResendModal();
    zdToast('Sent '+ZD_FILE.type.replace('doc','.docx').replace('pdf','.pdf').replace('sheet','.xlsx')+' to '+code.value+' \u2713');
    btn.disabled=false;btn.textContent='\u2191 Send';
  }).catch(function(e){
    console.error('Resend failed:',e);
    alert('Send failed: '+e.message);
    btn.disabled=false;btn.textContent='\u2191 Send';
  });
}

function zdDownload(){
  var btn=document.getElementById('zd-download-btn');
  btn.textContent='Preparing\u2026';btn.style.pointerEvents='none';
  getEditedBlob().then(function(result){
    var url=URL.createObjectURL(result.blob);
    var a=document.createElement('a');
    a.href=url;a.download=result.filename;a.click();
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
    btn.textContent='\u2713 Downloaded';
    var orig=btn.textContent;
    setTimeout(function(){btn.textContent='\u2193 Download edited';btn.style.pointerEvents='';},2500);
  }).catch(function(e){
    btn.textContent='\u2193 Download edited';btn.style.pointerEvents='';
    alert('Download failed: '+e.message);
  });
}
<\/script>

${isPdf ? `<script>
var zdAnnotations=[];
var zdPdfDoc=null;
var _zdPdfCurrentTool='text';
var _zdPdfPages=[];

function setPdfTool(tool){
  _zdPdfCurrentTool=tool;
  document.querySelectorAll('.zd-pdf-tool-btn').forEach(function(b){b.classList.remove('active');});
  var btn=document.getElementById('zd-pdf-tool-'+tool);
  if(btn)btn.classList.add('active');
  document.dispatchEvent(new CustomEvent('zd-tool-change',{detail:tool}));
}

function renderPDF(arrayBuffer){
  pdfjsLib.getDocument({data:arrayBuffer}).promise.then(function(pdf){
    zdPdfDoc=pdf;
    var container=document.getElementById('zd-pdf-container');
    container.innerHTML='';
    var renderAll=function(){
      var promises=[];
      for(var i=1;i<=pdf.numPages;i++){
        promises.push(pdf.getPage(i).then(function(page){
          var pageNum=page.pageNumber;
          var viewport=page.getViewport({scale:1.5});
          var wrapper=document.createElement('div');
          wrapper.style.cssText='position:relative;display:block;width:'+viewport.width+'px;margin:0 auto 20px;box-shadow:0 1px 6px rgba(0,0,0,0.08);border-radius:2px;background:white;';
          var canvas=document.createElement('canvas');
          canvas.width=viewport.width;
          canvas.height=viewport.height;
          canvas.style.display='block';
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
          attachAnnotationOverlay(wrapper,canvas,pageNum-1);
          return page.render({canvasContext:canvas.getContext('2d'),viewport:viewport}).promise;
        }));
      }
      return Promise.all(promises);
    };
    renderAll().then(function(){
      var info=document.getElementById('zd-pdf-page-info');
      if(info)info.textContent='1/'+pdf.numPages;
      var strip=document.getElementById('zd-thumb-strip');
      strip.innerHTML='';
      for(var i=1;i<=Math.min(pdf.numPages,20);i++){
        var thumb=document.createElement('div');
        thumb.className='zd-thumb-page'+(i===1?' active':'');
        thumb.textContent=i;
        strip.appendChild(thumb);
      }
    });
  });
}

function attachAnnotationOverlay(wrapper,canvas,pageIndex){
  var overlay=document.createElement('div');
  overlay.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
  wrapper.appendChild(overlay);
  document.addEventListener('zd-tool-change',function(e){overlay.style.pointerEvents=e.detail==='text'?'auto':'none';});
  overlay.addEventListener('click',function(e){
    if(overlay.style.pointerEvents!=='auto')return;
    if(_zdPdfCurrentTool!=='text')return;
    var box=document.createElement('div');
    box.contentEditable=true;
    box.style.cssText='position:absolute;left:'+e.offsetX+'px;top:'+e.offsetY+'px;min-width:80px;padding:2px 6px;border:1.5px dashed '+getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#00C49A'+';background:rgba(255,255,255,0.9);font-size:12px;font-family:Helvetica,sans-serif;outline:none;cursor:text;border-radius:2px;box-shadow:0 1px 4px rgba(0,0,0,0.08);';
    overlay.appendChild(box);
    box.focus();
    box.addEventListener('blur',function(){
      if(box.innerText.trim()){
        zdAnnotations.push({pageIndex:pageIndex,x:e.offsetX,y:e.offsetY,text:box.innerText.trim()});
      }
    });
  });
}

function exportAnnotatedPDF(){
  if(!ZD_FILE.content||ZD_FILE.content.indexOf('data:')!==0)return Promise.reject(new Error('No PDF data'));
  if(!window.PDFLib)return Promise.reject(new Error('PDF library not loaded.'));
  try{
    var b64=ZD_FILE.content.split(',')[1];
    var bin=atob(b64);
    var arr=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    return PDFLib.PDFDocument.load(arr).then(function(pdfDoc){
      var fontRef=null;
      return pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica).then(function(font){
        fontRef=font;
        var pages=pdfDoc.getPages();
        zdAnnotations.forEach(function(anno){
          var page=pages[anno.pageIndex];
          if(!page)return;
          var size=page.getSize();
          page.drawText(anno.text,{
            x:anno.x/1.5,
            y:size.height-(anno.y/1.5),
            size:12,
            font:fontRef,
            color:PDFLib.rgb(0.1,0.1,0.1)
          });
        });
        return pdfDoc.save();
      });
    }).then(function(bytes){
      var blob=new Blob([bytes],{type:'application/pdf'});
      return {blob:blob,filename:ZD_FILE.name.replace(/\\.[^.]+$/,'')+'_edited.pdf'};
    });
  }catch(e){return Promise.reject(e);}
}

function pdfPrevPage(){}
function pdfNextPage(){}
<\/script>` : ''}

</body>
</html>`;
}
