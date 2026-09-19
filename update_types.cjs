const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('DocumentPayment')) {
  const paymentInterface = `
export interface DocumentPayment {
  id: string;
  amount: number;
  date: string;
}
`;
  content = content.replace("export interface GestarianDocument {", paymentInterface + "\nexport interface GestarianDocument {");
  
  content = content.replace(
    "notes?: string;",
    "notes?: string;\n  payments?: DocumentPayment[];"
  );
  
  fs.writeFileSync('src/types.ts', content);
}
