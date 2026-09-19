const fs = require('fs');

let content = fs.readFileSync('src/components/NewUserModal.tsx', 'utf8');

content = content.replace(
  "const [email,\n      agencyEmail, setEmail] = useState(currentUser.email || '');\n  const [agencyEmail, setAgencyEmail] = useState(currentUser.agencyEmail || '');",
  "const [email, setEmail] = useState(currentUser.email || '');\n  const [agencyEmail, setAgencyEmail] = useState(currentUser.agencyEmail || '');"
);

fs.writeFileSync('src/components/NewUserModal.tsx', content);
