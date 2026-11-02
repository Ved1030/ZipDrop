const fs = require('fs');
let p = 'frontend/components/editor/EditorShell.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/style:\s*\n\s*outline:/, 'style: \n          outline:');
c = c.replace(/caret-color: #1a73e8;\s*\n\s*\,/s, 'caret-color: #1a73e8;\n        ,\n');
c = c.replace(/caret-color: #1a73e8;\s*\,/s, 'caret-color: #1a73e8;\n        ,\n');
fs.writeFileSync(p, c);
