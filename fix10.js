const fs = require('fs');
let p = 'frontend/components/editor/EditorShell.tsx';
let c = fs.readFileSync(p,'utf8');
// brute force
c = c.replace(/style:[^\n]*/,'style: ');
let idx = c.indexOf('onUpdate:');
if(idx > -1) {
  // look backwards for caret-color
  let before = c.slice(0,idx);
  let m = before.match(/caret-color[^\n]*/);
  if(m) {
    c = before.slice(0, before.lastIndexOf(m[0])) + 'caret-color: #1a73e8;\n        ,\n' + c.slice(idx);
    fs.writeFileSync(p,c);
    console.log('ok');
    return;
  }
}
console.log('no');
