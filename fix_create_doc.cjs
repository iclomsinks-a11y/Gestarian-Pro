const fs = require('fs');
let content = fs.readFileSync('src/components/CreateDocumentModal.tsx', 'utf8');

// Add allDocuments to Props
content = content.replace(
  "preselectedClientId?: string | null;",
  "preselectedClientId?: string | null;\n  allDocuments?: GestarianDocument[];"
);

content = content.replace(
  "preselectedClientId = null,",
  "preselectedClientId = null,\n  allDocuments = [],"
);

content = content.replace(
  "preselectedClientId,",
  "preselectedClientId,\n  allDocuments,"
);

const stateBlock = `  // Estado básico
  const [docNumber] = useState<string>(
    initialBudget?.number || (
      docType === 'presupuesto'
        ? \`PRE-\${baseId}\`
        : \`FAC-\${baseId}\`
    )
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialBudget ? initialBudget.clientId : (preselectedClientId || clients[0]?.id || '')
  );
  const [series, setSeries] = useState<string>(initialBudget?.series || 'A');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [expediente, setExpediente] = useState<string>(
    initialBudget?.expediente || \`EXP-\${baseId}\`
  );`;

const newStateBlock = `
  const generateNewId = () => {
    const currentYear = new Date().getFullYear().toString().slice(-2); // '26'
    
    if (docType === 'presupuesto') {
      const presCount = allDocuments.filter(d => d.type === 'presupuesto').length + 1;
      const num = String(presCount).padStart(4, '0');
      return { num: \`P\${currentYear}\${num}\`, exp: \`E\${currentYear}\${num}\` };
    } 
    
    if (docType === 'factura' && initialBudget) {
      // Inherit the 4 digits from the budget
      // P260001 -> 0001
      const budgetDigits = initialBudget.number.slice(-4);
      return { num: \`F\${currentYear}\${budgetDigits}\`, exp: initialBudget.expediente || \`E\${currentYear}\${budgetDigits}\` };
    }
    
    if (docType === 'factura') {
       const count = allDocuments.filter(d => d.type === 'factura').length + 1;
       const num = String(count).padStart(4, '0');
       return { num: \`F\${currentYear}\${num}\`, exp: \`E\${currentYear}\${num}\` };
    }

    if (docType === 'factura_proforma') {
      const fpCount = allDocuments.filter(d => d.type === 'factura_proforma').length + 1;
      const num = String(fpCount).padStart(4, '0');
      return { num: \`FP\${currentYear}\${num}\`, exp: initialBudget?.expediente || '' };
    }
    
    if (docType === 'recibo_abono') {
      const raCount = allDocuments.filter(d => d.type === 'recibo_abono').length + 1;
      const num = String(raCount).padStart(5, '0');
      return { num: \`Recibo número \${num}\`, exp: initialBudget?.expediente || '' };
    }

    return { num: \`DOC-\${Date.now()}\`, exp: \`EXP-\${Date.now()}\` };
  };

  const [generatedIds] = useState(generateNewId());

  // Estado básico
  const [docNumber] = useState<string>(initialBudget?.number && docType !== 'factura' ? initialBudget.number : generatedIds.num);
  const [expediente, setExpediente] = useState<string>(initialBudget?.expediente || generatedIds.exp);
  
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialBudget ? initialBudget.clientId : (preselectedClientId || clients[0]?.id || '')
  );
  const [series, setSeries] = useState<string>(initialBudget?.series || 'A');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
`;

content = content.replace(stateBlock, newStateBlock);

fs.writeFileSync('src/components/CreateDocumentModal.tsx', content);
