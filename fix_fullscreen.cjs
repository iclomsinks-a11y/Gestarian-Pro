const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the Fullscreen button text span
content = content.replace(
  /<span className="text-\[10px\] uppercase font-bold whitespace-nowrap">\{isFullscreen \? "Salir Completa" : "Pantalla Completa"\}<\/span>/g,
  ''
);

// Also remove gap-2 from the button since there is no text now
content = content.replace(
  'className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-white/80 backdrop-blur-md border border-[#CBD5E1] text-[#475569] hover:text-[#0F2942] hover:bg-white hover:scale-105 rounded-full shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"',
  'className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] p-3 bg-white/80 backdrop-blur-md border border-[#CBD5E1] text-[#475569] hover:text-[#0F2942] hover:bg-white hover:scale-105 rounded-full shadow-lg transition-all cursor-pointer flex items-center justify-center group"'
);

fs.writeFileSync('src/App.tsx', content);
