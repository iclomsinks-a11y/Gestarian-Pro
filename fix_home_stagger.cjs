const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'HomeView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import motion
content = content.replace(
  "import React from 'react';",
  "import React from 'react';\nimport { motion } from 'framer-motion';"
);

// 2. Add variants and change root div to motion.div
content = content.replace(
  "  const hasCustomBg = Boolean(currentUser.bgPortraitUrl || currentUser.bgLandscapeUrl);\n\n  return (\n    <div\n      className=\"relative w-screen h-[100dvh] max-h-[100dvh] bg-[#0F172A] overflow-hidden flex flex-col items-center justify-between snap-start shrink-0\"\n      id=\"page-inicio\"\n    >",
  `  const hasCustomBg = Boolean(currentUser.bgPortraitUrl || currentUser.bgLandscapeUrl);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
  };
  const slideLeft = { hidden: { x: -50, opacity: 0 }, show: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 60 } } };
  const slideRight = { hidden: { x: 50, opacity: 0 }, show: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 60 } } };
  const slideTop = { hidden: { y: -50, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60 } } };
  const slideBottom = { hidden: { y: 50, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60 } } };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative w-screen h-[100dvh] max-h-[100dvh] bg-black overflow-hidden flex flex-col items-center justify-between snap-start shrink-0"
      id="page-inicio"
    >`
);

content = content.replace(
  "    </div>\n  );\n};\n",
  "    </motion.div>\n  );\n};\n"
);

// 3. Background Image
content = content.replace(
  "      <div\n        className=\"absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-100\"",
  "      <motion.div\n        initial={{ opacity: 0 }}\n        animate={{ opacity: 1 }}\n        transition={{ delay: 1.5, duration: 1.2, ease: \"easeInOut\" }}\n        className=\"absolute inset-0 z-0 bg-cover bg-center bg-no-repeat\""
);
content = content.replace(
  "          })`,\n        }}\n      />",
  "          })`,\n        }}\n      />"
);

// 4. Top-left buttons
content = content.replace(
  "      <div className=\"absolute top-3 left-3 z-50 flex items-center gap-2\">",
  "      <motion.div variants={slideLeft} className=\"absolute top-3 left-3 z-50 flex items-center gap-2\">"
);
content = content.replace(
  "        )}\n      </div>",
  "        )}\n      </motion.div>"
);

// 5. Top-right notifications
content = content.replace(
  "      <div className=\"absolute top-3 right-16 z-50\">",
  "      <motion.div variants={slideRight} className=\"absolute top-3 right-16 z-50\">"
);
content = content.replace(
  "        )}\n      </div>",
  "        )}\n      </motion.div>"
);

// 6. Casio Clock
content = content.replace(
  "      <div className=\"relative z-10 w-full pt-[10px] px-3 sm:px-6\">",
  "      <motion.div variants={slideTop} className=\"relative z-10 w-full pt-[10px] px-3 sm:px-6\">"
);
content = content.replace(
  "        />\n      </div>",
  "        />\n      </motion.div>"
);

// 7. Pending reviews
content = content.replace(
  "      {pendingBudgetReviews.length > 0 && (\n        <div className=\"relative z-20 w-full max-w-lg mx-auto px-4 my-auto space-y-3\">",
  "      {pendingBudgetReviews.length > 0 && (\n        <motion.div variants={slideLeft} className=\"relative z-20 w-full max-w-lg mx-auto px-4 my-auto space-y-3\">"
);
content = content.replace(
  "            </div>\n          ))}\n        </div>\n      )}",
  "            </div>\n          ))}\n        </motion.div>\n      )}"
);

// 8. Footer buttons
content = content.replace(
  "      <div className=\"relative z-10 w-full pb-8 px-4 sm:px-8 flex justify-center items-center\">",
  "      <motion.div variants={slideBottom} className=\"relative z-10 w-full pb-8 px-4 sm:px-8 flex justify-center items-center\">"
);
content = content.replace(
  "        </div>\n      </div>",
  "        </div>\n      </motion.div>"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('HomeView.tsx updated successfully.');
