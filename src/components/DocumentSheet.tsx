import React from 'react';
import { Home } from 'lucide-react';
import { GestarianDocument, DocumentPayment } from '../types';
import { VerifactuSection } from './VerifactuSection';

/**
 * Hoja oficial unificada de Factura / Presupuesto para todas las vistas.
 *
 * Características solicitadas:
 * - Sin la columna enumerada (#).
 * - Columna unidades y precio con anchura reducida en móvil para evitar desborde del importe.
 * - Tarjeta ajustada a 3px de aire lateral en móvil (mx-[3px]), con 3px de espacio en líneas de concepto (px-[3px]).
 * - Totales antes de Observaciones y Veri*Factu.
 * - Observaciones y Veri*Factu después del total.
 * - Fecha de validez SOLO en presupuestos, NUNCA en facturas.
 * - Sin iconos ni botones en la hoja imprimible (se gestionan en contenedor o con print:hidden).
 */

export const isInvoiceType = (type?: string) =>
  type === 'factura' || type === 'factura_rectificativa' || type === 'factura_proforma';

export const isBudgetType = (type?: string) =>
  type === 'presupuesto' || type === 'budget';

export const getDocumentSheetTitle = (type?: string): string => {
  switch (type) {
    case 'factura':
      return 'FACTURA';
    case 'factura_rectificativa':
      return 'FACTURA RECTIFICATIVA';
    case 'factura_proforma':
      return 'FACTURA PROFORMA';
    case 'orden_trabajo':
      return 'ORDEN DE TRABAJO';
    case 'recibo_abono':
    case 'recibo':
      return 'RECIBO';
    default:
      return 'PRESUPUESTO';
  }
};

const GREY_FILL = { backgroundColor: 'rgba(0, 0, 0, 0.10)' };

const formatDeliveryDate = (dateVal?: string, timeVal?: string): string => {
  if (!dateVal) return '---';
  let cleanDate = dateVal.trim();
  let extractedTime = '';
  const timeInDateMatch = cleanDate.match(/(\d{2}:\d{2})/);
  if (timeInDateMatch) extractedTime = timeInDateMatch[1];
  cleanDate = cleanDate.replace(/\s*(a\s+las|A\s+LAS)?\s*\d{2}:\d{2}(:\d{2})?/gi, '').trim();
  const finalTime = timeVal?.trim() || extractedTime;

  let dd = '';
  let mm = '';
  let yy = '';
  const isoMatch = cleanDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    yy = isoMatch[1].slice(-2);
    mm = isoMatch[2].padStart(2, '0');
    dd = isoMatch[3].padStart(2, '0');
  } else {
    const esMatch = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (esMatch) {
      dd = esMatch[1].padStart(2, '0');
      mm = esMatch[2].padStart(2, '0');
      yy = esMatch[3].slice(-2);
    } else {
      const d = new Date(cleanDate);
      if (!isNaN(d.getTime())) {
        dd = String(d.getDate()).padStart(2, '0');
        mm = String(d.getMonth() + 1).padStart(2, '0');
        yy = String(d.getFullYear()).slice(-2);
      }
    }
  }

  if (!dd || !mm || !yy) return cleanDate + (finalTime ? ` a las ${finalTime}` : '');
  return `${dd}/${mm}/${yy}${finalTime ? ` a las ${finalTime}` : ''}`;
};

interface DocumentSheetProps {
  document: GestarianDocument;
  logoUrl?: string;
  isEditing?: boolean;
  onUpdateItem?: (idx: number, field: string, value: any) => void;
  onUpdateNotes?: (notes: string) => void;
  printMode?: boolean;
}

export const DocumentSheet: React.FC<DocumentSheetProps> = ({
  document: doc,
  logoUrl,
  isEditing = false,
  onUpdateItem,
  onUpdateNotes,
  printMode = false,
}) => {
  const isInvoice = isInvoiceType(doc.type);
  const isBudget = isBudgetType(doc.type);
  const title = getDocumentSheetTitle(doc.type);
  const effectiveLogoUrl = logoUrl || (doc as any).issuerLogoUrl || (doc as any).issuerLogo;

  const items = doc.items || [];
  const subtotal = Number(doc.subtotal) || 0;
  const ivaAmount = Number(doc.ivaAmount) || 0;
  const total = Number(doc.total) || 0;

  const payments: DocumentPayment[] = (doc as any).payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const isTotalPaid =
    (total > 0 && totalPaid >= total - 0.01) || doc.status === 'pagada' || (doc.status as string) === 'liquidada';
  const pendingAmount = Math.max(0, total - totalPaid);
  const showPayments = !printMode && (isInvoice || doc.type === 'recibo_abono') && (isTotalPaid || payments.length > 0);

  const defaultNotes = isBudget
    ? 'Validez del presupuesto: 30 días. Este presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración. Se ruega puntualidad para entregar el vehículo en la fecha y hora establecida.'
    : 'Factura oficial emitida según normativa tributaria vigente.';

  const vehicleLabel =
    `${doc.vehicleBrand || ''} ${doc.vehicleModel || ''}`.trim() || (doc as any).vehicleType || '';
  const showVehicle = doc.showVehicleData !== false && Boolean(doc.vehiclePlate || vehicleLabel);

  return (
    <div className="space-y-5 text-slate-900 w-full max-w-full">
      {/* 1. CABECERA: TÍTULO, NÚMERO, EXPEDIENTE Y FECHA (VALIDEZ SOLO EN PRESUPUESTOS) */}
      <div className="flex flex-wrap items-end justify-between pb-3 mb-4 border-b-2 border-slate-300 gap-2">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-wider text-slate-400 break-words">
          {title}
        </h1>
        <div className="text-right space-y-1 ml-auto">
          <div className="text-lg sm:text-2xl font-black font-mono tracking-tight text-slate-900">
            Nº {doc.number} {doc.expediente ? `• EXP: ${doc.expediente}` : ''}
          </div>
          <div className="text-xs sm:text-sm font-semibold font-mono text-slate-600 flex flex-wrap items-center justify-end gap-x-2">
            <span>
              FECHA EMISIÓN: <strong>{doc.date || new Date().toISOString().split('T')[0]}</strong>
            </span>
            {isBudget && (
              <>
                <span>•</span>
                <span>
                  VALIDEZ: <strong>30 DÍAS</strong>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. DATOS EMISOR Y CLIENTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Emisor / Taller */}
        <div className="border border-slate-300 rounded-2xl p-3.5 sm:p-5 flex items-start justify-between gap-3 shadow-2xs" style={GREY_FILL}>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-xs sm:text-base uppercase text-slate-500 tracking-wider block mb-1">
              EMISOR / TALLER:
            </span>
            <h2 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight truncate">
              {doc.issuerName}
            </h2>
            {doc.issuerAddress && (
              <p className="text-xs sm:text-base text-slate-700 mt-1 leading-relaxed font-medium line-clamp-2">
                {doc.issuerAddress}
              </p>
            )}
            <p className="text-xs sm:text-base text-slate-700 mt-1">
              CIF: <span className="font-bold font-mono text-slate-900">{doc.issuerCif || '---'}</span>
            </p>
            <p className="text-xs sm:text-base text-slate-600 mt-0.5 truncate">
              Tel: <span className="font-bold text-slate-900">{doc.issuerPhone || '---'}</span>
              {doc.issuerEmail ? ` • ${doc.issuerEmail}` : ''}
            </p>
          </div>
          {effectiveLogoUrl && (
            <div className="shrink-0 flex items-center justify-center p-1.5 bg-white border border-slate-200 rounded-xl">
              <img
                src={effectiveLogoUrl}
                alt={doc.issuerName}
                className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Cliente / Destinatario */}
        <div className="border border-slate-300 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-start shadow-2xs" style={GREY_FILL}>
          <span className="font-bold text-xs sm:text-base uppercase text-slate-500 tracking-wider mb-1">
            CLIENTE / DESTINATARIO
          </span>
          <div className="space-y-0.5 text-slate-700">
            <p className="font-black text-base sm:text-xl uppercase text-slate-900 truncate">
              {doc.clientName || 'Cliente'}
            </p>
            <p className="text-xs sm:text-base">
              NIF/CIF: <span className="font-bold font-mono text-slate-900">{doc.clientCif || '---'}</span>
            </p>
            <p className="text-xs sm:text-base line-clamp-2">
              Dirección: <span className="font-medium text-slate-800">{doc.clientAddress || '---'}</span>
            </p>
            <p className="text-xs sm:text-base text-slate-600 truncate">
              Tel: <span className="font-bold text-slate-900">{doc.clientPhone || '---'}</span>
              {doc.clientEmail ? ` • ${doc.clientEmail}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* 3. VEHÍCULO */}
      {showVehicle && (
        <div className="border border-slate-300 rounded-2xl p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-2 w-full shadow-2xs" style={GREY_FILL}>
          <div className="flex items-center gap-2.5 flex-wrap">
            {doc.vehiclePlate && (
              <span className="font-mono font-black text-xl sm:text-3xl text-slate-900 tracking-wider">
                {doc.vehiclePlate}
              </span>
            )}
            <span className="text-xs sm:text-sm font-bold uppercase text-slate-800 tracking-tight">
              {vehicleLabel}
            </span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-500 font-mono tracking-tight sm:text-right">
            {formatDeliveryDate(
              doc.vehicleDeliveryDate || doc.proposedDeliveryDate,
              doc.vehicleDeliveryTime || doc.proposedDeliveryTime
            )}
          </div>
        </div>
      )}

      {/* LUGAR DE LA TAREA / LOCALIZACIÓN */}
      {(doc.showLocationData !== false || doc.type === 'presupuesto') && (doc.taskLocation || (doc.type === 'presupuesto' && doc.clientAddress)) && (
        <div className="border border-emerald-300 rounded-2xl p-3 sm:p-3.5 mb-4 flex items-center gap-3 w-full bg-emerald-50/70 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
              Localización / Lugar donde se realiza la tarea:
            </span>
            <span className="text-xs sm:text-base font-extrabold text-slate-900 uppercase truncate">
              {doc.taskLocation || doc.clientAddress}
            </span>
          </div>
        </div>
      )}

      {/* 4. TABLA DE LÍNEAS FACTURABLES */}
      {/* 
          Ajustes solicitados:
          - Eliminada la columna enumerada (#).
          - Ampliado el espacio en las líneas de concepto hasta 3px por ambos lados dentro de la tarjeta (px-[3px] sm:px-3).
          - Tarjeta ampliada hasta 3px de aire por los lados (mx-[3px] sm:mx-0).
          - Anchura reducida en columnas CANT. y PRECIO UNIT. para que el IMPORTE / TOTAL se muestre en móvil portrait sin desbordar.
      */}
      <div
        className="mb-5 border border-slate-300 rounded-2xl overflow-hidden shadow-2xs mx-[3px] sm:mx-0"
        style={GREY_FILL}
      >
        <table className="w-full text-left border-collapse table-auto sm:table-fixed">
          <thead>
            <tr
              className="border-b-2 border-slate-300 text-[10px] sm:text-xs uppercase font-black text-slate-700 tracking-wider"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.12)' }}
            >
              <th className="py-2.5 px-[3px] sm:px-3 text-left">
                DESCRIPCIÓN DE TRABAJOS Y RECAMBIOS
              </th>
              <th className="py-2.5 px-[3px] sm:px-2 text-center w-10 sm:w-16 whitespace-nowrap">
                CANT.
              </th>
              <th className="py-2.5 px-[3px] sm:px-2 text-right w-16 sm:w-24 whitespace-nowrap">
                PRECIO
              </th>
              <th className="py-2.5 px-[3px] sm:px-3 text-right w-20 sm:w-28 whitespace-nowrap">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300/80">
            {items.map((item, idx) => {
              const uPrice = Number(item.unitPrice) || 0;
              const qty = Number(item.quantity) || 0;
              const amt = Number(item.amount) || qty * uPrice;
              return (
                <tr key={item.id || idx} className="hover:bg-black/5 transition-colors">
                  <td className="py-2 px-[3px] sm:px-3 text-slate-900 font-bold text-xs sm:text-base break-words">
                    {isEditing && onUpdateItem ? (
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => onUpdateItem(idx, 'description', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs sm:text-base font-bold bg-white"
                      />
                    ) : (
                      item.description
                    )}
                  </td>
                  <td className="py-2 px-[3px] sm:px-2 text-center text-slate-800 font-mono font-bold text-xs sm:text-base whitespace-nowrap">
                    {isEditing && onUpdateItem ? (
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(idx, 'quantity', e.target.value)}
                        className="w-10 sm:w-14 p-1 border border-slate-300 rounded-lg text-xs sm:text-base text-center font-mono font-bold bg-white"
                      />
                    ) : (
                      qty
                    )}
                  </td>
                  <td className="py-2 px-[3px] sm:px-2 text-right text-slate-800 font-mono font-bold text-xs sm:text-base whitespace-nowrap">
                    {isEditing && onUpdateItem ? (
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => onUpdateItem(idx, 'unitPrice', e.target.value)}
                        className="w-16 sm:w-20 p-1 border border-slate-300 rounded-lg text-xs sm:text-base text-right font-mono font-bold bg-white"
                      />
                    ) : (
                      `${uPrice.toFixed(2)} €`
                    )}
                  </td>
                  <td className="py-2 px-[3px] sm:px-3 text-right font-mono font-black text-xs sm:text-base text-slate-900 whitespace-nowrap">
                    {amt.toFixed(2)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. TOTALES (ANTES DE OBSERVACIONES Y VERI*FACTU) */}
      <div className="flex justify-end mb-5">
        <div className="w-full sm:w-80 md:w-96 border border-slate-300 rounded-2xl p-4 space-y-2 shadow-2xs" style={GREY_FILL}>
          <div className="flex justify-between items-center text-slate-600 text-xs sm:text-sm">
            <span className="font-semibold uppercase">Base Imponible:</span>
            <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">{subtotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 text-xs sm:text-sm">
            <span className="font-semibold uppercase">IVA ({doc.applyIva ? `${doc.ivaRate ?? 21}%` : '0%'}):</span>
            <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">{ivaAmount.toFixed(2)} €</span>
          </div>
          {doc.applyIrpf && (
            <div className="flex justify-between items-center text-rose-700 text-xs sm:text-sm">
              <span className="font-semibold uppercase">Retención IRPF ({doc.irpfRate}%):</span>
              <span className="font-mono font-bold text-sm sm:text-base">-{(Number(doc.irpfAmount) || 0).toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t-2 border-slate-300 pt-2 text-slate-900 font-black">
            <span className="text-sm sm:text-base uppercase">TOTAL:</span>
            <span className="font-mono text-xl sm:text-2xl text-slate-900">{total.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* 6. OBSERVACIONES Y VERI*FACTU (DESPUÉS DEL TOTAL) */}
      <div className={`grid grid-cols-1 ${isInvoice ? 'md:grid-cols-2' : ''} gap-4 mb-5`}>
        {/* Condiciones y Observaciones */}
        <div>
          <span className="font-bold text-xs uppercase text-slate-500 block mb-1">
            CONDICIONES Y OBSERVACIONES:
          </span>
          {isEditing && onUpdateNotes ? (
            <textarea
              value={doc.notes || ''}
              onChange={(e) => onUpdateNotes(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm outline-none resize-none leading-relaxed font-medium bg-white"
              rows={4}
            />
          ) : (
            <p
              className="p-3.5 border border-slate-300 rounded-2xl text-slate-700 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line shadow-2xs"
              style={GREY_FILL}
            >
              {doc.notes || defaultNotes}
            </p>
          )}
        </div>

        {/* QR y Bloque Verifactu (solo en facturas emitidas) */}
        {isInvoice && (
          <div>
            <VerifactuSection document={doc} size="md" />
          </div>
        )}
      </div>

      {/* 7. HISTORIAL DE ABONOS (solo en pantalla, oculto en impresión) */}
      {showPayments && (
        <div className="pt-3 border-t border-slate-200 print:hidden no-print">
          <div className={`${isTotalPaid ? 'bg-emerald-50/90 border-2 border-emerald-500' : 'bg-slate-50 border border-slate-200'} rounded-xl p-3.5`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h5 className={`text-[11px] font-bold uppercase ${isTotalPaid ? 'text-emerald-800' : 'text-slate-700'}`}>
                {isTotalPaid ? 'Factura abonada · Historial de abonos' : 'Historial de abonos parciales:'}
              </h5>
              <div className="text-[11px] font-mono flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                  Abonado: {(totalPaid > 0 ? totalPaid : isTotalPaid ? total : 0).toFixed(2)} €
                </span>
                {!isTotalPaid && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold">
                    Pendiente: {pendingAmount.toFixed(2)} €
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                    <th className="py-1.5 px-3">Fecha</th>
                    <th className="py-1.5 px-3">Método</th>
                    <th className="py-1.5 px-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {payments.length > 0 ? (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-1.5 px-3 text-slate-600">{p.date || doc.date}</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">{p.method || 'Abono'}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-emerald-700">+{(p.amount || 0).toFixed(2)} €</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-1.5 px-3 text-slate-600">{doc.date}</td>
                      <td className="py-1.5 px-3 font-sans text-slate-600">Cobro de factura (liquidación total)</td>
                      <td className="py-1.5 px-3 text-right font-bold text-emerald-700">+{total.toFixed(2)} €</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. PIE OFICIAL */}
      <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
        <p>
          Documento oficial generado por <strong>{doc.issuerName}</strong> (CIF: {doc.issuerCif}).
          {doc.issuerPhone && ` Teléfono de atención: ${doc.issuerPhone}.`}
        </p>
      </div>
    </div>
  );
};

export default DocumentSheet;
