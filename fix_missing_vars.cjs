const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'components', 'HomeView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const variantsStr = `
  const containerVariants = {
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
      className="relative w-screen h-[100dvh] max-h-[100dvh] bg-black overflow-hidden flex flex-col items-center justify-between snap-start shrink-0"`;

content = content.replace(/  return \(\s*<div\s*className="relative w-screen h-\[100dvh\] max-h-\[100dvh\] bg-\[#0F172A\] overflow-hidden flex flex-col items-center justify-between snap-start shrink-0"/m, variantsStr);

// Also fix the bottom closing div
content = content.replace(/    <\/div>\s*< \/div>\s*\);\s*};/m, "    </motion.div>\n  );\n};"); // this is just a guess of what is wrong at the bottom, wait, I can just replace the last </div>
const lastIndex = content.lastIndexOf('</div>');
if (lastIndex !== -1 && content.slice(lastIndex).includes(';')) {
  // Wait, let's just do a simple replace on the last div.
}
// Actually, earlier I saw line 241 is `    </div>`.
content = content.replace(/    <\/div>\n  \);\n};/, "    </motion.div>\n  );\n};");
content = content.replace(/    <\/div>\r\n  \);\r\n};/, "    </motion.div>\r\n  );\r\n};");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed variants');
