const fs = require('fs');
let content = fs.readFileSync('src/components/ExpedientesView.tsx', 'utf8');

content = content.replace(
  "export const ExpedientesView: React.FC<ExpedientesViewProps> = ({",
  "interface ExpedientesViewProps {\n  documents: GestarianDocument[];\n  clients: Client[];\n  onBack: () => void;\n  logoUrl?: string;\n  userFullName?: string;\n  onNavigateHome: () => void;\n  onOpenMenu?: () => void;\n  initialExpedienteId?: string | null;\n}\n\nexport const ExpedientesView: React.FC<ExpedientesViewProps> = ({"
);

content = content.replace(
  "onNavigateHome,\n  onOpenMenu\n}) => {\n  const [selectedExpediente, setSelectedExpediente] = useState<string | null>(null);",
  "onNavigateHome,\n  onOpenMenu,\n  initialExpedienteId = null\n}) => {\n  const [selectedExpediente, setSelectedExpediente] = useState<string | null>(initialExpedienteId);\n\n  React.useEffect(() => {\n    if (initialExpedienteId) setSelectedExpediente(initialExpedienteId);\n  }, [initialExpedienteId]);"
);

// We need to clean up duplicated interfaces if the regex replaced twice
// Actually let's use a safer replace

fs.writeFileSync('src/components/ExpedientesView.tsx', content);
