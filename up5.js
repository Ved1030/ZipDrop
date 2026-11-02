const fs=require('fs');
let p='frontend/components/editor/StatusBar.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.replace(/<span>Page.*?<\/span>/, '<span>Page {Math.min(pageCount, Math.max(1, Math.floor(((document.getElementById("editor-canvas")?.scrollTop)||0 - 24) / (1123 + 24)) + 1))} of {pageCount}</span>');
fs.writeFileSync(p,c);
