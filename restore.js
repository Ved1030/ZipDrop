const fs=require('fs');
let p='frontend/components/editor/EditorShell.tsx';
let c=fs.readFileSync(p,'utf8');
const good =         style: \
          outline: none;
          min-height: 864px;
          font-size: 11pt;
          line-height: 1.7;
          color: #000;
          font-family: 'Calibri','Segoe UI',Arial,sans-serif;
          caret-color: #1a73e8;
        \,;
c = c.replace(/style:[\s\S]*?onUpdate:/, good + '\n    onUpdate:');
fs.writeFileSync(p,c);
console.log('ok');
