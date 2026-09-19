import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Building2, Layers, CheckCircle, Mail } from 'lucide-react';
import { GestarianDocument } from '../types';
import { computeQuarterlyReport } from '../services/storage';
import {
  generateExcelXmlReport,
  generateSageReport,
  generateA3Report,
  downloadFile,
} from '../services/exportService';

interface FiscalReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: GestarianDocument[];
}

export const FiscalReportsModal: React.FC<FiscalReportsModalProps> = ({
  isOpen,
  onClose,
  documents,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<'1T' | '2T' | '3T' | '4T'>('1T');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [exportNotice, setExportNotice] = useState<string>('');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const report = computeQuarterlyReport(documents, selectedQuarter, selectedYear);

  const handleDownloadExcel = () => {
    const xmlContent = generateExcelXmlReport(report);
    const filename = `Libro_Facturas_Emitidas_${selectedQuarter}_${selectedYear}.xls`;
    downloadFile(filename, xmlContent, 'application/vnd.ms-excel');
    setExportNotice(`Archivo ${filename} generado y descargado con éxito.`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleDownloadSage = () => {
    const sageContent = generateSageReport(report);
    const filename = `Diario_SAGE_${selectedQuarter}_${selectedYear}.csv`;
    downloadFile(filename, sageContent, 'text/csv;charset=utf-8;');
    setExportNotice(`Asientos contables para SAGE descargados (${filename}).`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleDownloadA3 = () => {
    const a3Content = generateA3Report(report);
    const filename = `Enlace_A3ECO_${selectedQuarter}_${selectedYear}.txt`;
    downloadFile(filename, a3Content, 'text/plain;charset=utf-8;');
    setExportNotice(`Fichero de enlace para A3ASESOR descargado (${filename}).`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F172A]/40 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl my-6 bg-[#F8F7F3] border border-[#D5D2C9] rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Encabezado */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E0D8] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A]">
              Cumplimiento Fiscal para Autónomos y Profesionales
            </span>
            <h2 className="text-base font-bold uppercase tracking-wider text-[#0F172A]">
              Informes Trimestrales para Gestoría
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#64748B] hover:text-white hover:bg-rose-600 rounded-sm transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Notificación de descarga */}
        {exportNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Filtros de Trimestre */}
        <div className="p-4 bg-[#F1F0EB] border-b border-[#E2E0D8] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#334155]">
              Trimestre:
            </span>
            {(['1T', '2T', '3T', '4T'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                  selectedQuarter === q
                    ? 'bg-[#0F2942] text-white'
                    : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#EFECE6]'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B]">Ejercicio fiscal:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-xs font-semibold text-[#0F172A]"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>

        {/* Resumen Fiscal Trimestral */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#E2E0D8] rounded-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                Facturas Emitidas
              </span>
              <span className="text-xl font-bold font-mono text-[#0F172A]">
                {report.totalInvoices}
              </span>
              <span className="block text-[10px] text-[#94A3B8] mt-1">{report.periodLabel}</span>
            </div>

            <div className="p-4 bg-white border border-[#E2E0D8] rounded-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                Base Imponible Total
              </span>
              <span className="text-xl font-bold font-mono text-[#0F172A]">
                {report.totalSubtotal.toFixed(2)} €
              </span>
              <span className="block text-[10px] text-[#94A3B8] mt-1">Ingresos brutos declarables</span>
            </div>

            <div className="p-4 bg-white border border-[#E2E0D8] rounded-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A] mb-1">
                IVA Repercutido (21%)
              </span>
              <span className="text-xl font-bold font-mono text-[#1E3A8A]">
                {report.totalIva.toFixed(2)} €
              </span>
              <span className="block text-[10px] text-[#64748B] mt-1">Casilla Modelo 303</span>
            </div>

            <div className="p-4 bg-white border border-[#E2E0D8] rounded-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0F172A] mb-1">
                Total Facturado
              </span>
              <span className="text-xl font-bold font-mono text-[#0F2942]">
                {report.totalGross.toFixed(2)} €
              </span>
              <span className="block text-[10px] text-[#64748B] mt-1">Importe íntegro del {selectedQuarter}</span>
            </div>
          </div>

          {/* Opciones de Exportación para la Gestoría */}
          <div className="p-5 bg-white border border-[#E2E0D8] rounded-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Generación de Archivos para la Gestoría
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Archivos formateados listos para remitir por correo a tu asesor fiscal o cargar directamente en el software contable:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Botón XLS / XML Excel */}
              <button
                id="btn-export-excel"
                onClick={handleDownloadExcel}
                className="flex flex-col items-start p-3.5 bg-[#F8F7F3] hover:bg-[#EFECE6] border border-[#CBD5E1] hover:border-[#0F2942] rounded-xs transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-1 text-emerald-700">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Excel / XLS XML</span>
                </div>
                <p className="text-[11px] text-[#475569] leading-tight">
                  Libro oficial de facturas emitidas con desglose por líneas, bases y cuotas de IVA.
                </p>
                <span className="mt-2 text-[10px] font-semibold text-[#0F2942] uppercase underline">
                  Descargar archivo .xls
                </span>
              </button>

              {/* Botón SAGE */}
              <button
                id="btn-export-sage"
                onClick={handleDownloadSage}
                className="flex flex-col items-start p-3.5 bg-[#F8F7F3] hover:bg-[#EFECE6] border border-[#CBD5E1] hover:border-[#0F2942] rounded-xs transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-1 text-[#1E3A8A]">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">SAGE (CSV)</span>
                </div>
                <p className="text-[11px] text-[#475569] leading-tight">
                  Estructura de asientos contables con cuentas de cliente (430), ventas (705) e IVA (477).
                </p>
                <span className="mt-2 text-[10px] font-semibold text-[#0F2942] uppercase underline">
                  Descargar diario .csv
                </span>
              </button>

              {/* Botón A3 */}
              <button
                id="btn-export-a3"
                onClick={handleDownloadA3}
                className="flex flex-col items-start p-3.5 bg-[#F8F7F3] hover:bg-[#EFECE6] border border-[#CBD5E1] hover:border-[#0F2942] rounded-xs transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-1 text-[#0F2942]">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">A3 / A3ECO</span>
                </div>
                <p className="text-[11px] text-[#475569] leading-tight">
                  Fichero estandarizado de enlace para el software Wolters Kluwer A3ASESOR.
                </p>
                <span className="mt-2 text-[10px] font-semibold text-[#0F2942] uppercase underline">
                  Descargar enlace .txt
                </span>
              </button>
            </div>
          </div>

          {/* Tabla de Facturas del Trimestre */}
          <div className="bg-white border border-[#E2E0D8] rounded-sm p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Facturas Emitidas en {selectedQuarter} {selectedYear} ({report.invoices.length})
            </h4>

            {report.invoices.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#64748B]">
                No hay facturas emitidas registradas para este periodo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E0D8] text-[10px] uppercase text-[#64748B] font-bold">
                      <th className="py-2">Número</th>
                      <th className="py-2">Fecha</th>
                      <th className="py-2">Cliente</th>
                      <th className="py-2">CIF/NIF</th>
                      <th className="py-2 text-right">Base</th>
                      <th className="py-2 text-right">IVA (21%)</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F0EB]">
                    {report.invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2.5 font-mono font-bold text-[#0F172A]">{inv.number}</td>
                        <td className="py-2.5 text-[#475569]">{inv.date}</td>
                        <td className="py-2.5 font-medium text-[#0F172A]">{inv.clientName}</td>
                        <td className="py-2.5 font-mono text-[#64748B]">{inv.clientCif}</td>
                        <td className="py-2.5 text-right font-mono text-[#475569]">{inv.subtotal.toFixed(2)} €</td>
                        <td className="py-2.5 text-right font-mono text-[#1E3A8A]">{inv.ivaAmount.toFixed(2)} €</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[#0F2942]">{inv.total.toFixed(2)} €</td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-xs ${
                              inv.status === 'enviada'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-[#F1F5F9] text-[#475569]'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer con botón de salida */}
        <div className="px-6 py-3.5 bg-[#F1F0EB] border-t border-[#E2E0D8] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#64748B]">
            Libros de facturación e informes fiscales
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#0F172A] border border-[#CBD5E1] rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cerrar Informes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
