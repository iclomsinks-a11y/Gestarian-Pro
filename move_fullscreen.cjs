const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'className="fixed bottom-6 left-6 z-[100] p-3 bg-white/80 backdrop-blur-md border border-[#CBD5E1] text-[#475569] hover:text-[#0F2942] hover:bg-white hover:scale-105 rounded-full shadow-lg transition-all cursor-pointer flex items-center justify-center group"',
  'className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-white/80 backdrop-blur-md border border-[#CBD5E1] text-[#475569] hover:text-[#0F2942] hover:bg-white hover:scale-105 rounded-full shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"'
);

content = content.replace(
  /<span className="absolute left-14 opacity-0 group-hover:opacity-100 transition-opacity bg-\[#0F2942\] text-white text-\[10px\] uppercase font-bold px-2 py-1 rounded whitespace-nowrap pointer-events-none">\s*\{isFullscreen \? "Salir Completa" : "Pantalla Completa"\}\s*<\/span>/,
  '<span className="text-[10px] uppercase font-bold whitespace-nowrap">{isFullscreen ? "Salir Completa" : "Pantalla Completa"}</span>'
);

fs.writeFileSync('src/App.tsx', content);
