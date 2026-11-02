const fs=require('fs');
let p='frontend/components/editor/EditorShell.tsx';
let c=fs.readFileSync(p,'utf8');
let i = c.indexOf('style:');
console.log(c.slice(i, i+120));
