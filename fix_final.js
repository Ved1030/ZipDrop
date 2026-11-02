const fs = require('fs');
let p = 'frontend/components/editor/EditorShell.tsx';
let c = fs.readFileSync(p,'utf8');
// Just use the original working style structure but with our new setup
const fixed = c.replace(/editorProps:\s*\{[\s\S]*?onUpdate:/, 
editorProps: {
      attributes: {
        id: "editor",
        style: \
          outline: none;
          min-height: 864px;
          font-size: 11pt;
          line-height: 1.7;
          color: #000;
          font-family: 'Calibri','Segoe UI',Arial,sans-serif;
          caret-color: #1a73e8;
        \,
      },
    },
    onUpdate:);
fs.writeFileSync(p,fixed);
console.log('done');
