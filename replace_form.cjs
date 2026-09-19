const fs = require('fs');
let file = fs.readFileSync('src/components/NewUserModal.tsx', 'utf8');

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

file = file.replace('<form onSubmit={handleSendCode} className="space-y-6">', '<form onSubmit={handleSendCode} className="space-y-6">\n' + tabButtons + '\n              <div className={activeTab === \'fiscal\' ? \'space-y-6\' : \'hidden\'}>');

const empleadosStart = `<div className="space-y-4">\n                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1 flex items-center gap-1.5">\n                  <Users className="w-3.5 h-3.5" />\n                  Equipo de Trabajo / Empleados`;

const empleadosWrapper = `              </div>\n              <div className={activeTab === 'empleados' ? 'space-y-6' : 'hidden'}>\n                <div className="space-y-4">\n                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1 flex items-center gap-1.5">\n                  <Users className="w-3.5 h-3.5" />\n                  Equipo de Trabajo / Empleados`;

file = file.replace(empleadosStart, empleadosWrapper);

const formEnd = `<div className="pt-3 border-t border-[#E2E0D8] flex items-center justify-between sticky bottom-0 bg-[#F8F7F3] pb-2">`;

const customTab = `              </div>\n              <div className={activeTab === 'personalizacion' ? 'space-y-6' : 'hidden'}>\n                <div className="space-y-4">\n                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1">\n                    Personalización Visual\n                  </h3>\n                  <div>\n                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">\n                      Logotipo (URL) - 250x250px recomendado\n                    </label>\n                    <input\n                      type="url"\n                      value={logoUrl}\n                      onChange={(e) => setLogoUrl(e.target.value)}\n                      placeholder="https://ejemplo.com/logo.png"\n                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5D2C9] focus:border-[#0F2942] focus:ring-1 focus:ring-[#0F2942] rounded-sm text-[#0F172A] outline-none"\n                    />\n                  </div>\n                  <div>\n                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">\n                      Fondo Pantalla de Inicio (Vertical / Portrait) URL\n                    </label>\n                    <input\n                      type="url"\n                      value={bgPortraitUrl}\n                      onChange={(e) => setBgPortraitUrl(e.target.value)}\n                      placeholder="https://ejemplo.com/bg-portrait.jpg"\n                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5D2C9] focus:border-[#0F2942] focus:ring-1 focus:ring-[#0F2942] rounded-sm text-[#0F172A] outline-none"\n                    />\n                  </div>\n                  <div>\n                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">\n                      Fondo Pantalla de Inicio (Horizontal / Landscape) URL\n                    </label>\n                    <input\n                      type="url"\n                      value={bgLandscapeUrl}\n                      onChange={(e) => setBgLandscapeUrl(e.target.value)}\n                      placeholder="https://ejemplo.com/bg-landscape.jpg"\n                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5D2C9] focus:border-[#0F2942] focus:ring-1 focus:ring-[#0F2942] rounded-sm text-[#0F172A] outline-none"\n                    />\n                  </div>\n                </div>\n              </div>\n              <div className="pt-3 border-t border-[#E2E0D8] flex items-center justify-between sticky bottom-0 bg-[#F8F7F3] pb-2">`;

file = file.replace(formEnd, customTab);

fs.writeFileSync('src/components/NewUserModal.tsx', file);
console.log('Done replacing modal UI');
