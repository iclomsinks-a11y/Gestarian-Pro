const fs = require('fs');

let content = fs.readFileSync('src/components/PlateScannerModal.tsx', 'utf8');

// 1. In scan_plate, when there is an error, show buttons: 'Introducir Manualmente' and 'Reintentar'
const scanPlateErrorRegex = /\{\s*error && \([\s\S]*?<\/div>\s*\)\s*\}/;
const replacementError = `{error && (
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="p-3 w-full bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-start justify-center gap-2.5 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                  <div className="flex w-full items-center justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setStep('manual_entry')}
                      className="flex-1 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider border border-[#38BDF8]/40 transition-colors cursor-pointer"
                    >
                      Introducir Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        captureFrame();
                      }}
                      className="flex-1 py-2.5 bg-[#38BDF8] hover:bg-[#0284C7] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-colors cursor-pointer"
                    >
                      Reintentar OCR
                    </button>
                  </div>
                </div>
              )}`;

content = content.replace(scanPlateErrorRegex, replacementError);

// 2. In manual_entry, replace the input with a giant 80% width one.
const manualInputRegex = /<input\s+type="text"\s+required\s+value=\{manualPlate\}\s+onChange=\{[^}]+\}\s+placeholder="Ej: 1234-BBB"\s+className="[^"]+"\s*\/>/;
const replacementInput = `<div className="flex justify-center w-full my-4">
                  <input
                    type="text"
                    required
                    value={manualPlate}
                    onChange={(e) => {
                      setManualPlate(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="1234-BBB"
                    className="w-[80%] h-20 text-center bg-white/10 border-2 border-white/20 focus:border-[#38BDF8] rounded-xl text-white font-mono font-black text-4xl sm:text-5xl uppercase outline-none shadow-inner"
                  />
                </div>`;
content = content.replace(manualInputRegex, replacementInput);

// 3. Rename buttons in manual_entry to match the request exactly:
// "botón de seguir tomando imágenes" and "botón generar presupuesto"
const manualFooterRegex = /<button\s+type="button"\s+onClick=\{\(\) => vehicleCameraInputRef\.current\?\.click\(\)\}\s+className="[^"]+"\s*>[\s\S]*?<\/button>/;
const replacementManualFooter = `<button
                    type="button"
                    onClick={() => vehicleCameraInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#075985] text-white rounded-xl text-sm font-bold uppercase tracking-wider border border-[#38BDF8]/30 transition-all cursor-pointer shadow-md w-full sm:w-auto"
                  >
                    <Camera className="w-5 h-5 text-white" />
                    <span>Seguir Tomando Imágenes</span>
                  </button>`;
content = content.replace(manualFooterRegex, replacementManualFooter);

// 4. Update Generar Presupuesto text in manual entry to be simpler
const manualGenerateBudgetRegex = /<span>Guardar Imágenes y Generar Presupuesto<\/span>/;
content = content.replace(manualGenerateBudgetRegex, `<span>Generar Presupuesto</span>`);

fs.writeFileSync('src/components/PlateScannerModal.tsx', content);
