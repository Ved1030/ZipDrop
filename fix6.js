const fs = require('fs');
let p = 'frontend/components/editor/EditorShell.tsx';
let c = fs.readFileSync(p, 'utf8');
const bad =         style: 
          outline: none;
          min-height: 864px;
          font-size: 11pt;
          line-height: 1.7;
          color: #000;
          font-family: 'Calibri','Segoe UI',Arial,sans-serif;
          caret-color: #1a73e8;
        ,;
const good = "        style: \\n          outline: none;\\n          min-height: 864px;\\n          font-size: 11pt;\\n          line-height: 1.7;\\n          color: #000;\\n          font-family: 'Calibri','Segoe UI',Arial,sans-serif;\\n          caret-color: #1a73e8;\\n        ,";
if(c.indexOf(bad) >= 0) { c = c.split(bad).join(good); fs.writeFileSync(p,c); console.log('y'); } else { console.log('n'); }
