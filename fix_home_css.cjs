const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes('@keyframes slideInLeft')) {
  css += `
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slideInTop {
  from { opacity: 0; transform: translateY(-50px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideInBottom {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInBg {
  from { opacity: 0; }
  to { opacity: 1; }
}

.stagger-left { opacity: 0; animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.stagger-right { opacity: 0; animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.stagger-top { opacity: 0; animation: slideInTop 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.stagger-bottom { opacity: 0; animation: slideInBottom 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.fade-in-bg { opacity: 0; animation: fadeInBg 1.5s ease-in-out forwards; animation-delay: 1.5s; }
`;
  fs.writeFileSync('src/index.css', css);
}

let content = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

content = content.replace(/import { motion } from 'framer-motion';\n/, '');

// Remove variants
content = content.replace(/  const containerVariants = {[\s\S]*?const slideBottom =.*?;\n\n/m, '');

// Replace root motion.div
content = content.replace(
  /    <motion\.div\s+variants={containerVariants}\s+initial="hidden"\s+animate="show"\s+className="relative w-screen h-\[100dvh\] max-h-\[100dvh\] bg-black overflow-hidden flex flex-col items-center justify-between snap-start shrink-0"\s+id="page-inicio"\s+>/m,
  `    <div
      className="relative w-screen h-[100dvh] max-h-[100dvh] bg-black overflow-hidden flex flex-col items-center justify-between snap-start shrink-0"
      id="page-inicio"
    >`
);

// Replace bg image
content = content.replace(
  /      <motion\.div\s+initial=\{\{ opacity: 0 \}\}\s+animate=\{\{ opacity: 1 \}\}\s+transition=\{\{ delay: 1\.5, duration: 1\.2, ease: "easeInOut" \}\}\s+className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"/m,
  `      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fade-in-bg"`
);

// Top left
content = content.replace(
  /<motion\.div variants={slideLeft} className="absolute top-3 left-3 z-50 flex items-center gap-2">/g,
  '<div className="absolute top-3 left-3 z-50 flex items-center gap-2 stagger-left" style={{ animationDelay: "0.2s" }}>'
);
// Top right
content = content.replace(
  /<motion\.div variants={slideRight} className="absolute top-3 right-16 z-50">/g,
  '<div className="absolute top-3 right-16 z-50 stagger-right" style={{ animationDelay: "0.4s" }}>'
);
// Top center
content = content.replace(
  /<motion\.div variants={slideTop} className="relative z-10 w-full pt-\[10px\] px-3 sm:px-6">/g,
  '<div className="relative z-10 w-full pt-[10px] px-3 sm:px-6 stagger-top" style={{ animationDelay: "0.6s" }}>'
);
// Budget review
content = content.replace(
  /<motion\.div variants={slideLeft} className="relative z-20 w-full max-w-lg mx-auto px-4 my-auto space-y-3">/g,
  '<div className="relative z-20 w-full max-w-lg mx-auto px-4 my-auto space-y-3 stagger-left" style={{ animationDelay: "0.8s" }}>'
);
// Footer
content = content.replace(
  /<motion\.div variants={slideBottom} className="relative z-10 w-full pb-8 px-4 sm:px-8 flex justify-center items-center">/g,
  '<div className="relative z-10 w-full pb-8 px-4 sm:px-8 flex justify-center items-center stagger-bottom" style={{ animationDelay: "1.0s" }}>'
);

// Replace all closing motion.divs
content = content.replace(/<\/motion\.div>/g, '</div>');

fs.writeFileSync('src/components/HomeView.tsx', content);
console.log("Reverted to CSS animations successfully.");
