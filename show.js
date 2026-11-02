const fs=require('fs');
let c=fs.readFileSync('C:/Users/guess/ZipDrop/orig_EditorShell.tsx','utf8');
let i=c.indexOf('editorProps');
let j=c.indexOf('onUpdate:', i);
console.log(c.slice(i,j+10));
