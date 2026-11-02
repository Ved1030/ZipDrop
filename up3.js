const fs=require('fs');
let p='frontend/components/editor/LeftSidebar.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.replace('pageIndex * 1056','24 + pageIndex * (1123 + 24)');
fs.writeFileSync(p,c);
