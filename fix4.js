const fs = require('fs');
let p = 'frontend/components/editor/EditorShell.tsx';
let c = fs.readFileSync(p, 'utf8');
// Try to reconstruct properly
let start = c.indexOf('style:');
if(start !== -1) {
  // find the comma after the style block
  let end = c.indexOf('      },', start);
  if(end !== -1) {
    let replacement = style: \
          outline: none;
          min-height: 864px;
          font-size: 11pt;
          line-height: 1.7;
          color: #000;
          font-family: 'Calibri','Segoe UI',Arial,sans-serif;
          caret-color: #1a73e8;
        \,;
    c = c.slice(0, start) + replacement + c.slice(end + 7); // keep the closing of attributes block structure
    fs.writeFileSync(p, c);
    console.log('done');
  } else console.log('noend');
} else console.log('nostart');
