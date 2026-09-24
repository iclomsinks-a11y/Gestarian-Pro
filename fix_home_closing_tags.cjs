const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'HomeView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The original script changed opening divs to motion.divs but not closing ones.

content = content.replace(
  "        )}\n      </div>\n\n      {/* Barra superior para notificaciones de METIS */}",
  "        )}\n      </motion.div>\n\n      {/* Barra superior para notificaciones de METIS */}"
);

content = content.replace(
  "        )}\n      </div>\n      \n      {/* Header: Reloj Digital Casio Vintage centrado arriba a 10px del borde superior */}",
  "        )}\n      </motion.div>\n      \n      {/* Header: Reloj Digital Casio Vintage centrado arriba a 10px del borde superior */}"
);

content = content.replace(
  "          fiscalAddress={currentUser.fiscalAddress} \n        />\n      </div>\n\n      {/* Notificación de METIS en la pantalla de inicio si hay presupuestos pendientes de valorar precios por el jefe */}",
  "          fiscalAddress={currentUser.fiscalAddress} \n        />\n      </motion.div>\n\n      {/* Notificación de METIS en la pantalla de inicio si hay presupuestos pendientes de valorar precios por el jefe */}"
);

// Pending budgets opening and closing:
content = content.replace(
  "      {pendingBudgetReviews.length > 0 && (\n        <div className=\"relative z-20 w-full max-w-lg mx-auto px-4 my-auto space-y-3\">",
  "      {pendingBudgetReviews.length > 0 && (\n        <motion.div variants={slideLeft} className=\"relative z-20 w-full max-w-lg mx-auto px-4 my-auto space-y-3\">"
);

content = content.replace(
  "              </span>\n            </div>\n          ))}\n        </div>\n      )}\n\n      {/* Espacio libre intermedio cuando no hay alertas */}",
  "              </span>\n            </div>\n          ))}\n        </motion.div>\n      )}\n\n      {/* Espacio libre intermedio cuando no hay alertas */}"
);

content = content.replace(
  "            <BidirectionalWavesIcon \n              className=\"w-6 h-6 sm:w-7 sm:h-7 text-white\" \n            />\n          </button>\n        </div>\n      </div>\n    </motion.div>\n  );\n};",
  "            <BidirectionalWavesIcon \n              className=\"w-6 h-6 sm:w-7 sm:h-7 text-white\" \n            />\n          </button>\n        </div>\n      </motion.div>\n    </motion.div>\n  );\n};"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed closing tags in HomeView.tsx');
