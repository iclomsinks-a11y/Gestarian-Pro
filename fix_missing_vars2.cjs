const fs = require('fs');
let content = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

const returnStatement = '  return (\n    <div\n      className="relative w-screen h-[100dvh] max-h-[100dvh] bg-[#0F172A] overflow-hidden flex flex-col items-center justify-between snap-start shrink-0"';

if (content.includes('bg-[#0F172A]')) {
  // Simple replace
  content = content.replace(
    /  return \([\s\S]*?id="page-inicio"[\s\S]*?>/,
`  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
  };
  const slideLeft = { hidden: { x: -50, opacity: 0 }, show: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } } };
  const slideRight = { hidden: { x: 50, opacity: 0 }, show: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } } };
  const slideTop = { hidden: { y: -50, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } } };
  const slideBottom = { hidden: { y: 50, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } } };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative w-screen h-[100dvh] max-h-[100dvh] bg-black overflow-hidden flex flex-col items-center justify-between snap-start shrink-0"
      id="page-inicio"
    >`
  );
  
  // Background animation
  content = content.replace(
    /      <div\s+className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-100"/,
    `      <motion.div\n        initial={{ opacity: 0 }}\n        animate={{ opacity: 1 }}\n        transition={{ delay: 1.5, duration: 1.2, ease: "easeInOut" }}\n        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"`
  );

  // Bottom closing
  const lastDiv = content.lastIndexOf('</div>');
  content = content.slice(0, lastDiv) + '</motion.div>' + content.slice(lastDiv + 6);

  fs.writeFileSync('src/components/HomeView.tsx', content);
  console.log("Fixed successfully.");
} else {
  console.log("Could not find the target strings.");
}
