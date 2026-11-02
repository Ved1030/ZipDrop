const fs=require('fs');
let p='frontend/components/editor/EditorShell.tsx';
let c=fs.readFileSync(p,'utf8');
let replacement = \"        style: \\n          outline: none;\\n          min-height: 864px;\\n          font-size: 11pt;\\n          line-height: 1.7;\\n          color: #000;\\n          font-family: 'Calibri','Segoe UI',Arial,sans-serif;\\n          caret-color: #1a73e8;\\n        ,\";
c = c.replace(/style:[\\s\\S]+?onUpdate:/, replacement + '\\n    onUpdate:');
fs.writeFileSync(p,c);
