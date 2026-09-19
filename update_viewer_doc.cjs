const fs = require('fs');
let file = fs.readFileSync('src/components/DocumentViewerModal.tsx', 'utf8');

const oldCompanyInfo = `<p className="text-sm text-[#475569]">{document.issuerEmail}</p>
                  </div>`;

const newCompanyInfo = `<p className="text-sm text-[#475569]">{document.issuerEmail}</p>
                  </div>
                  <div className="w-1/2 flex justify-end">
                    {document.issuerLogoUrl && (
                      <img src={document.issuerLogoUrl} alt="Logo" className="w-24 h-24 object-contain" />
                    )}
                  </div>`;

file = file.replace(oldCompanyInfo, newCompanyInfo);

fs.writeFileSync('src/components/DocumentViewerModal.tsx', file);
