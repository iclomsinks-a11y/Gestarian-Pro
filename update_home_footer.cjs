const fs = require('fs');

let content = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

// 1. Camera Button
content = content.replace(
  /className="p-3\.5 sm:p-4 bg-transparent backdrop-blur-sm rounded-full border-2 border-emerald-500 text-emerald-500 hover:scale-105 transition-all shadow-\[0_0_20px_rgba\(16,185,129,0\.5\)\] hover:shadow-\[0_0_30px_rgba\(16,185,129,0\.8\)\]"/,
  'className="p-3.5 sm:p-4 bg-transparent rounded-full text-white hover:scale-105 transition-all drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] hover:drop-shadow-[0_0_25px_rgba(16,185,129,1)]"'
);
content = content.replace(
  /<Camera className="w-7 h-7 sm:w-8 sm:h-8" \/>/,
  '<Camera strokeWidth={1} className="w-7 h-7 sm:w-8 sm:h-8" />'
);

// 2. Menu Button
content = content.replace(
  /className="p-3\.5 sm:p-4 bg-transparent backdrop-blur-sm rounded-full border-2 border-white text-white hover:scale-105 transition-all shadow-\[0_0_20px_rgba\(255,255,255,0\.4\)\] hover:shadow-\[0_0_30px_rgba\(255,255,255,0\.7\)\]"/,
  'className="p-3.5 sm:p-4 bg-transparent rounded-full text-white hover:scale-105 transition-all drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.9)]"'
);
content = content.replace(
  /<Menu className="w-7 h-7 sm:w-8 sm:h-8" \/>/,
  '<Menu strokeWidth={1} className="w-7 h-7 sm:w-8 sm:h-8" />'
);

// 3. AI Button
content = content.replace(
  /className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-transparent border-2 border-\[#38BDF8\] text-\[#38BDF8\] font-black text-lg flex items-center justify-center shadow-\[0_0_20px_rgba\(56,189,248,0\.6\)\] hover:shadow-\[0_0_30px_rgba\(56,189,248,0\.9\)\] hover:scale-105 transition-all backdrop-blur-sm"/,
  'className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-transparent text-white font-thin text-3xl flex items-center justify-center hover:scale-105 transition-all drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] hover:drop-shadow-[0_0_25px_rgba(56,189,248,1)]"'
);

// 4. Voice Button
content = content.replace(
  /className="p-3\.5 sm:p-4 bg-transparent backdrop-blur-sm rounded-full border-2 border-orange-500 text-orange-500 hover:scale-105 transition-all shadow-\[0_0_20px_rgba\(249,115,22,0\.6\)\] hover:shadow-\[0_0_30px_rgba\(249,115,22,0\.9\)\]"/,
  'className="p-3.5 sm:p-4 bg-transparent rounded-full text-white hover:scale-105 transition-all drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] hover:drop-shadow-[0_0_25px_rgba(249,115,22,1)]"'
);
content = content.replace(
  /<Waves className="w-7 h-7 sm:w-8 sm:h-8" \/>/,
  '<Waves strokeWidth={1} className="w-7 h-7 sm:w-8 sm:h-8" />'
);

fs.writeFileSync('src/components/HomeView.tsx', content);
