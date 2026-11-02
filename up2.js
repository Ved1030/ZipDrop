const fs=require('fs');
let p='frontend/components/editor/EditorShell.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.replace('Math.ceil(height / 1056)','Math.ceil(height / 1123)');
c=c.replace('Math.floor(scrollTop / 1056)','Math.floor((scrollTop - 24) / (1123 + 24))');
fs.writeFileSync(p,c);
