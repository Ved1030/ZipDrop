const fs=require('fs');
let p='frontend/components/editor/EditorShell.tsx';
let c=fs.readFileSync(p,'utf8');
// Try simpler replacement - from 'style:' to just before 'onUpdate:' line
let si = c.indexOf('style:');
let oi = c.indexOf('onUpdate:');
if(si >=0 && oi >=0) {
  c = c.slice(0,si) + \"        style: \\n          outline: none;\\n          min-height: 864px;\\n          font-size: 11pt;\\n          line-height: 1.7;\\n          color: #000;\\n          font-family: 'Calibri','Segoe UI',Arial,sans-serif;\\n          caret-color: #1a73e8;\\n        ,\\n    \" + c.slice(oi);
  fs.writeFileSync(p,c);
  console.log('ok');
} else console.log('no');
