const fs = require('fs');

let content = fs.readFileSync('src/components/NewUserModal.tsx', 'utf8');

const target = `                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@dmcar.es"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                      />
                    </div>`;

const newTarget = `                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@dmcar.es"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Email de la gestoría (Informes trimestrales)
                      </label>
                      <input
                        type="email"
                        value={agencyEmail}
                        onChange={(e) => setAgencyEmail(e.target.value)}
                        placeholder="gestoria@asesores.com"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                      />
                    </div>`;

content = content.replace(target, newTarget);

fs.writeFileSync('src/components/NewUserModal.tsx', content);
