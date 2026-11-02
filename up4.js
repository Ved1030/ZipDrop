const fs=require('fs');
let p='frontend/components/editor/StatusBar.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.replace('<span>Page 1 of {pageCount}</span>','<span>Page {(Math.min((document.getElementById("editor-canvas")?.scrollTop||0 - 24) / (1123 + 24), pageCount-1) | 0) + 1} of {pageCount}</span>');
fs.writeFileSync(p,c);
