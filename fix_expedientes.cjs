const fs = require('fs');

let content = fs.readFileSync('src/components/ExpedientesView.tsx', 'utf8');

// The detail view:
content = content.replace(
  /<div className="flex flex-col h-full bg-\[#F8F7F3\] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-screen shrink-0">/,
  '<div id="page-expedientes" className="flex flex-col h-full min-h-screen bg-[#F8F7F3] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-screen shrink-0 snap-start">'
);

// The dashboard view:
content = content.replace(
  /<div id="page-expedientes" className="flex flex-col h-full bg-\[#F8F7F3\] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-full max-w-7xl mx-auto snap-start shrink-0">/,
  '<div id="page-expedientes" className="flex flex-col h-full min-h-screen bg-[#F8F7F3] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-screen shrink-0 snap-start">'
);

fs.writeFileSync('src/components/ExpedientesView.tsx', content);
