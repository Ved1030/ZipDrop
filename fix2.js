const fs = require('fs');
let p = 'frontend/components/editor/DocumentCanvas.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('zoom !== 100 ? scale() : undefined,', "zoom !== 100 ? 'scale(' + (zoom/100) + ')' : undefined,");
fs.writeFileSync(p, c);
