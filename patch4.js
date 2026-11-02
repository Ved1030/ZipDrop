const fs = require('fs');
let p = 'frontend/components/editor/DocumentCanvas.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace("transform: zoom !== 100 ? 'scale(' + (zoom/100) + ')' : undefined,", "transform: zoom !== 100 ? scale() : undefined,");
fs.writeFileSync(p, c);
console.log('ok');
