const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = 'className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] p-3 bg-white/80 backdrop-blur-md border border-[#CBD5E1] text-[#475569] hover:text-[#0F2942] hover:bg-white hover:scale-105 rounded-full shadow-lg transition-all cursor-pointer flex items-center justify-center group"';
const replacement = 'className="fixed top-4 right-4 z-[100] p-2 text-white mix-blend-difference hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"';

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
