const fs=require('fs');
let p='frontend/components/editor/EditorShell.tsx';
let c=fs.readFileSync(p,'utf8');
if(c.indexOf('') > 0 && c.indexOf('caret-color') > 0) console.log('maybe');
else console.log('no');
