const fs = require('fs');
let p = 'C:/Users/guess/ZipDrop/frontend/components/editor/EditorShell.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/style:\s+/,'style: ');
c = c.replace(/caret-color: #1a73e8;\s*,/,'caret-color: #1a73e8;\n        ,');
fs.writeFileSync(p,c);
console.log('done');
