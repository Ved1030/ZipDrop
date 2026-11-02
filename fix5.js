const fs = require('fs');
let p = 'frontend/components/editor/EditorShell.tsx';
let c = fs.readFileSync(p, 'utf8');
const old =         style: 
          outline: none;
          min-height: 864px;
          font-size: 11pt;
          line-height: 1.7;
          color: #000;
          font-family: 'Calibri','Segoe UI',Arial,sans-serif;
          caret-color: #1a73e8;
        ,;
const neu =         style: \
          outline: none;
          min-height: 864px;
          font-size: 11pt;
          line-height: 1.7;
          color: #000;
          font-family: 'Calibri','Segoe UI',Arial,sans-serif;
          caret-color: #1a73e8;
        \,;
if(c.includes(old)) { c = c.split(old).join(neu); fs.writeFileSync(p,c); console.log('ok1'); }
else { console.log('no'); }
