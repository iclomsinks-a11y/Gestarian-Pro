const fs = require('fs');

let content = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

// 1. Camera Button -> Verde Agua (Teal / Cyan) -> #14b8a6 (Teal-500) o #2dd4bf (Teal-400)
// Current: rgba(16,185,129
content = content.replace(
  /drop-shadow-\[0_0_15px_rgba\(16,185,129,0\.8\)\] hover:drop-shadow-\[0_0_25px_rgba\(16,185,129,1\)\]/,
  'drop-shadow-[0_0_15px_rgba(45,212,191,0.8)] hover:drop-shadow-[0_0_25px_rgba(45,212,191,1)]'
);

// 2. Menu Button -> Gris -> #94a3b8 (Slate-400)
// Current: rgba(255,255,255
content = content.replace(
  /drop-shadow-\[0_0_15px_rgba\(255,255,255,0\.6\)\] hover:drop-shadow-\[0_0_25px_rgba\(255,255,255,0\.9\)\]/,
  'drop-shadow-[0_0_15px_rgba(148,163,184,0.6)] hover:drop-shadow-[0_0_25px_rgba(148,163,184,0.9)]'
);

// 3. AI Button -> Turquesa -> #38bdf8 (Sky-400) / #06b6d4 (Cyan-500)
// Current: rgba(56,189,248
// Mantenemos este igual o lo reforzamos, ya era turquesa (56,189,248).
// No hacemos cambios.

// 4. Voice Button -> Melocotón -> #fb923c (Orange-400) / #f87171 (Red-400) - Peach is usually ~ #ffb07c (255, 176, 124)
// Current: rgba(249,115,22 -> Orange-500
content = content.replace(
  /drop-shadow-\[0_0_15px_rgba\(249,115,22,0\.8\)\] hover:drop-shadow-\[0_0_25px_rgba\(249,115,22,1\)\]/,
  'drop-shadow-[0_0_15px_rgba(251,146,60,0.8)] hover:drop-shadow-[0_0_25px_rgba(251,146,60,1)]'
);

fs.writeFileSync('src/components/HomeView.tsx', content);
