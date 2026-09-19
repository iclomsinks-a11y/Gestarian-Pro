const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  /export type DocumentType = 'presupuesto' \| 'factura' \| 'orden_trabajo';/g,
  "export type DocumentType = 'presupuesto' | 'factura' | 'orden_trabajo' | 'factura_recibida' | 'factura_proforma' | 'recibo_abono';"
);

fs.writeFileSync('src/types.ts', content);
