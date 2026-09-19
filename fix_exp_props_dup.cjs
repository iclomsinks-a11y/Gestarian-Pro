const fs = require('fs');
let content = fs.readFileSync('src/components/ExpedientesView.tsx', 'utf8');

// The original interface was:
const orig = `interface ExpedientesViewProps {
  documents: GestarianDocument[];
  clients: Client[];
  onBack: () => void;
  logoUrl?: string;
  userFullName?: string;
  onNavigateHome: () => void;
  onOpenMenu?: () => void;
}`;

content = content.replace(orig, "");

fs.writeFileSync('src/components/ExpedientesView.tsx', content);
