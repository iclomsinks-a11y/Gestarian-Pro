const fs = require('fs');
let file = fs.readFileSync('src/components/NewUserModal.tsx', 'utf8');

// The goal is to wrap the fields in tabs.
// We'll insert the tab buttons right after `<form onSubmit={handleSendCode} className="space-y-6">`
// Then we'll wrap the "Clasificación del Negocio" + "Datos Fiscales" + "Datos de Contacto" in `{activeTab === 'fiscal' && (...)}`
// And "Equipo de Trabajo / Empleados" in `{activeTab === 'empleados' && (...)}`
// And add `{activeTab === 'personalizacion' && (...)}`

const tabButtons = `
              <div className="flex border-b border-[#E2E0D8] mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('fiscal')}
                  className={\`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === 'fiscal' ? 'text-[#0F2942] border-b-2 border-[#0F2942]' : 'text-[#64748B] hover:text-[#0F172A]'}\`}
                >
                  Datos Fiscales
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('empleados')}
                  className={\`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === 'empleados' ? 'text-[#0F2942] border-b-2 border-[#0F2942]' : 'text-[#64748B] hover:text-[#0F172A]'}\`}
                >
                  Empleados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('personalizacion')}
                  className={\`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === 'personalizacion' ? 'text-[#0F2942] border-b-2 border-[#0F2942]' : 'text-[#64748B] hover:text-[#0F172A]'}\`}
                >
                  Personalización
                </button>
              </div>
`;

// Start of fiscal wrapper
file = file.replace('<form onSubmit={handleSendCode} className="space-y-6">', '<form onSubmit={handleSendCode} className="space-y-6">\n' + tabButtons + '\n              <div className={activeTab === \'fiscal\' ? \'space-y-6\' : \'hidden\'}>');

// Start of empleados wrapper. We need to find the "Equipo de Trabajo / Empleados" header
const empleadosStart = `<div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Equipo de Trabajo / Empleados`;

const empleadosWrapper = `              </div>
              <div className={activeTab === 'empleados' ? 'space-y-6' : 'hidden'}>
                <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Equipo de Trabajo / Empleados`;

file = file.replace(empleadosStart, empleadosWrapper);

// Start of personalizacion wrapper and close it before the sticky footer.
const formEnd = `<div className="pt-3 border-t border-[#E2E0D8] flex items-center justify-between sticky bottom-0 bg-[#F8F7F3] pb-2">`;

const customTab = `              </div>
              <div className={activeTab === 'personalizacion' ? 'space-y-6' : 'hidden'}>
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1">
                    Personalización Visual
                  </h3>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                      Logotipo (URL) - 250x250px recomendado
                    </label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://ejemplo.com/logo.png"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5D2C9] focus:border-[#0F2942] focus:ring-1 focus:ring-[#0F2942] rounded-sm text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                      Fondo Pantalla de Inicio (Vertical / Portrait Full HD) URL
                    </label>
                    <input
                      type="url"
                      value={bgPortraitUrl}
                      onChange={(e) => setBgPortraitUrl(e.target.value)}
                      placeholder="https://ejemplo.com/bg-portrait.jpg"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5D2C9] focus:border-[#0F2942] focus:ring-1 focus:ring-[#0F2942] rounded-sm text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                      Fondo Pantalla de Inicio (Horizontal / Landscape Full HD) URL
                    </label>
                    <input
                      type="url"
                      value={bgLandscapeUrl}
                      onChange={(e) => setBgLandscapeUrl(e.target.value)}
                      placeholder="https://ejemplo.com/bg-landscape.jpg"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5D2C9] focus:border-[#0F2942] focus:ring-1 focus:ring-[#0F2942] rounded-sm text-[#0F172A] outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-[#E2E0D8] flex items-center justify-between sticky bottom-0 bg-[#F8F7F3] pb-2">`;

file = file.replace(formEnd, customTab);

fs.writeFileSync('src/components/NewUserModal.tsx', file);
console.log('Done replacing modal UI');
