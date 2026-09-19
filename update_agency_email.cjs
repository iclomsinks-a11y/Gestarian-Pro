const fs = require('fs');

let content = fs.readFileSync('src/components/NewUserModal.tsx', 'utf8');

content = content.replace(
  "const [email, setEmail] = useState(currentUser.email || '');",
  "const [email, setEmail] = useState(currentUser.email || '');\n  const [agencyEmail, setAgencyEmail] = useState(currentUser.agencyEmail || '');"
);

content = content.replace(
  "email,",
  "email,\n      agencyEmail,"
);

// We need to inject the input for "Email de la gestoría" in the form.
// Let's find "Email de Contacto *" inside the Datos Fiscales section.
const emailInputRegex = /(<label className="block text-\[11px\] font-bold uppercase tracking-wider text-\[#334155\] mb-1">\s*Email de Contacto \*\s*<\/label>\s*<input\s*type="email"\s*required\s*value=\{email\}\s*onChange=\{\(e\) => setEmail\(e.target.value\)\}\s*placeholder="info@taller.com"\s*className="w-full px-3 py-2 text-xs bg-white border border-\[#D5D2C9\] rounded-lg text-\[#0F172A\] outline-none"\s*\/>\s*<\/div>)/;

const agencyEmailInput = `
                    <div className="sm:col-span-2 mt-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Email de la gestoría (Para informes trimestrales)
                      </label>
                      <input
                        type="email"
                        value={agencyEmail}
                        onChange={(e) => setAgencyEmail(e.target.value)}
                        placeholder="gestoria@asesores.com"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>`;

content = content.replace(emailInputRegex, `$1${agencyEmailInput}`);

fs.writeFileSync('src/components/NewUserModal.tsx', content);
