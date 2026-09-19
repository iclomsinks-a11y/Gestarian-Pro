const fs = require('fs');
let file = fs.readFileSync('src/components/CreateDocumentModal.tsx', 'utf8');

file = file.replace(
  /issuerEmail: currentUser\.email,/g,
  "issuerEmail: currentUser.email,\n      issuerLogoUrl: currentUser.logoUrl,"
);

// Also render the logo in the preview
const oldHeader = `<div className="w-1/2">
                    <h3 className="text-lg font-bold text-[#0F172A] uppercase">{currentUser.fullName}</h3>`;

const newHeader = `<div className="w-1/2">
                    <h3 className="text-lg font-bold text-[#0F172A] uppercase">{currentUser.fullName}</h3>`;

const oldCompanyInfo = `<p className="text-sm text-[#475569]">{currentUser.email}</p>
                  </div>`;

const newCompanyInfo = `<p className="text-sm text-[#475569]">{currentUser.email}</p>
                  </div>
                  <div className="w-1/2 flex justify-end">
                    {currentUser.logoUrl && (
                      <img src={currentUser.logoUrl} alt="Logo" className="w-24 h-24 object-contain" />
                    )}
                  </div>`;

file = file.replace(oldCompanyInfo, newCompanyInfo);

fs.writeFileSync('src/components/CreateDocumentModal.tsx', file);
