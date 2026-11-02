const fs = require('fs');
let c = fs.readFileSync('frontend/components/editor/EditorShell.tsx','utf8');
let i = c.indexOf('style:');
console.log(c.slice(i,i+50));
