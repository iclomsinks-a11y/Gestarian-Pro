const fs = require('fs');
let content = fs.readFileSync('src/components/CreateDocumentModal.tsx', 'utf8');

const targetHeader = `<h1 className="text-3xl font-black uppercase text-[#0F2942] tracking-tighter mb-2">
                 {docType === 'presupuesto' ? 'PRESUPUESTO' : 'FACTURA'}
               </h1>`;

const newHeader = `<h1 className="text-2xl sm:text-3xl font-black uppercase text-[#0F2942] tracking-tighter mb-2">
                 {docType === 'presupuesto' ? 'PRESUPUESTO' : 
                  docType === 'factura' ? 'FACTURA' :
                  docType === 'factura_proforma' ? 'FACTURA PROFORMA' :
                  docType === 'recibo_abono' ? 'RECIBO DE ABONO' : 'DOCUMENTO'}
               </h1>`;

content = content.replace(targetHeader, newHeader);

// Under Expediente we might need to show related Invoice (Factura) for recibo_abono
const targetExpediente = `<div className="flex justify-end gap-2 mt-2">
                 <span className="text-[10px] font-bold text-[#64748B] w-24 uppercase">Nº Expediente:</span>
                 <input 
                   type="text" 
                   value={expediente} 
                   onChange={e => setExpediente(e.target.value)}
                   className="text-[10px] font-bold text-[#0F172A] w-28 text-right bg-transparent outline-none border-b border-dashed border-gray-300 hover:border-gray-500 uppercase"
                 />
               </div>`;

const newExpediente = `<div className="flex justify-end gap-2 mt-2">
                 <span className="text-[10px] font-bold text-[#64748B] w-24 uppercase">Nº Expediente:</span>
                 <input 
                   type="text" 
                   value={expediente} 
                   onChange={e => setExpediente(e.target.value)}
                   className="text-[10px] font-bold text-[#0F172A] w-28 text-right bg-transparent outline-none border-b border-dashed border-gray-300 hover:border-gray-500 uppercase"
                 />
               </div>
               {docType === 'recibo_abono' && (
                 <div className="flex justify-end gap-2 mt-1">
                   <span className="text-[10px] font-bold text-[#64748B] w-24 uppercase">Ref. Factura:</span>
                   <span className="text-[10px] font-bold text-[#0F172A] w-28 text-right">
                     {initialBudget?.number || '---'}
                   </span>
                 </div>
               )}`;

content = content.replace(targetExpediente, newExpediente);

fs.writeFileSync('src/components/CreateDocumentModal.tsx', content);
