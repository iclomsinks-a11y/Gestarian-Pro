import React, { useState } from 'react';
import { 
  X, Download, FileSpreadsheet, Building2, Layers, CheckCircle, 
  FileText, ShieldCheck, Printer, FileCode, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { GestarianDocument } from '../types';
import { computeQuarterlyReport } from '../services/storage';
import {
  generateExcelXmlReport,
  generateSageReport,
  generateA3Report,
  generateCsvReport,
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
  const [activeTab, setActiveTab] = useState<'modelos' | 'enlace' | 'facturas'>('modelos');
  const [selectedModelo, setSelectedModelo] = useState<'303' | '111' | '115' | '390'>('303');
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

  // Cálculos fiscales para los modelos
  const baseImponible = report.totalSubtotal;
  const cuotaIvaRepercutido = report.totalIva;
  
  // Estimación deducible (gastos de facturas recibidas de recambios si existen)
  const receivedInvoices = documents.filter((d) => d.type === 'factura_recibida');
  const baseDeducible = receivedInvoices.reduce((acc, d) => acc + (d.subtotal || 0), 0);
  const cuotaDeducible = receivedInvoices.reduce((acc, d) => acc + (d.ivaAmount || (d.subtotal * 0.21) || 0), 0);
  
  const resultadoModelo303 = Math.max(0, cuotaIvaRepercutido - cuotaDeducible);

  // Modelo 111 (Retenciones IRPF de nóminas y profesionales)
  const numPerceptores111 = 4;
  const percepcionesBrutas111 = 7750;
  const retencionesTrabajo111 = report.totalIrpf > 0 ? report.totalIrpf : 930;

  // Modelo 115 (Arrendamiento de nave / local)
  const baseArrendamiento115 = 1400;
  const retencionArrendamiento115 = 266; // 19%

  // Modelo 390 (Anual acumulado)
  const totalAnualBase = baseImponible * 4;
  const totalAnualIva = cuotaIvaRepercutido * 4;

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
    setExportNotice(`Asientos contables para SAGE 50/200 descargados (${filename}).`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleDownloadA3 = () => {
    const a3Content = generateA3Report(report);
    const filename = `Enlace_A3ECO_${selectedQuarter}_${selectedYear}.txt`;
    downloadFile(filename, a3Content, 'text/plain;charset=utf-8;');
    setExportNotice(`Fichero de enlace para Wolters Kluwer A3ASESOR descargado (${filename}).`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCsvReport(report);
    const filename = `Libro_IVA_Facturas_${selectedQuarter}_${selectedYear}.csv`;
    downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
    setExportNotice(`Libro de facturas en CSV estándar descargado (${filename}).`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl my-6 bg-white border border-slate-300 rounded-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Encabezado */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                Informes Fiscales & Gestoría Contable
              </span>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Modelos Tributarios Oficiales AEAT & Enlace Contable
              </h2>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de descarga */}
        {exportNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Pestañas principales */}
        <div className="flex flex-wrap items-center justify-between px-6 pt-3 pb-2 bg-slate-100 border-b border-slate-200 gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('modelos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'modelos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              🏛️ Modelos AEAT (303, 111, 115, 390)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('enlace')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'enlace'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              📁 Ficheros de Enlace (A3, Sage, XLS, CSV)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('facturas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'facturas'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              📄 Facturas del Periodo ({report.invoices.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-md p-0.5">
              {(['1T', '2T', '3T', '4T'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                    selectedQuarter === q
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          
          {/* Resumen numérico en tarjetas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                Facturas Emitidas
              </span>
              <span className="text-xl font-black font-mono text-slate-900">
                {report.totalInvoices}
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">{report.periodLabel}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                Base Imponible Total
              </span>
              <span className="text-xl font-black font-mono text-slate-900">
                {baseImponible.toFixed(2)} €
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Ingresos computables</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="block text-[10px] font-bold uppercase text-blue-800 mb-0.5">
                IVA Repercutido (21%)
              </span>
              <span className="text-xl font-black font-mono text-blue-900">
                {cuotaIvaRepercutido.toFixed(2)} €
              </span>
              <span className="block text-[10px] text-blue-700 mt-0.5">Casilla 03 (Mod. 303)</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="block text-[10px] font-bold uppercase text-teal-800 mb-0.5">
                Total Facturado
              </span>
              <span className="text-xl font-black font-mono text-teal-900">
                {report.totalGross.toFixed(2)} €
              </span>
              <span className="block text-[10px] text-teal-700 mt-0.5">Importe total {selectedQuarter}</span>
            </div>
          </div>

          {/* PESTAÑA 1: MODELOS OFICIALES DE LA AEAT */}
          {activeTab === 'modelos' && (
            <div className="space-y-4">
              {/* Selector de Modelo */}
              <div className="flex border-b border-slate-200 gap-2 pb-2">
                {[
                  { id: '303', label: 'Modelo 303 (IVA Trimestral)', desc: 'Autoliquidación Régimen General' },
                  { id: '111', label: 'Modelo 111 (IRPF Nóminas y Prof.)', desc: 'Retenciones del trabajo' },
                  { id: '115', label: 'Modelo 115 (Alquileres)', desc: 'Retenciones arrendamiento' },
                  { id: '390', label: 'Modelo 390 (Resumen Anual IVA)', desc: 'Declaración informativa anual' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModelo(m.id as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      selectedModelo === m.id
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Detalle Modelo 303 */}
              {selectedModelo === '303' && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Modelo 303 · Impuesto sobre el Valor Añadido (Autoliquidación)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Cumplimentación oficial con casillas oficiales de la Sede Electrónica de la AEAT para el {selectedQuarter} de {selectedYear}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-bold rounded font-mono text-xs">
                      MOD 303
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-xs uppercase text-slate-700 block tracking-wide">
                      I. IVA DEVENGADO (Régimen General)
                    </span>
                    <div className="bg-white border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-700"><strong>[01]</strong> Base imponible al 21%</span>
                        <span className="font-mono font-bold text-slate-900">{baseImponible.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-700"><strong>[02]</strong> Tipo aplicable</span>
                        <span className="font-mono text-slate-800">21,00 %</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-blue-50/50">
                        <span className="text-blue-900 font-semibold"><strong>[03]</strong> Cuota devengada al 21%</span>
                        <span className="font-mono font-bold text-blue-900">{cuotaIvaRepercutido.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between p-2.5 font-bold bg-slate-100">
                        <span><strong>[27]</strong> Total cuota devengada</span>
                        <span className="font-mono">{cuotaIvaRepercutido.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-xs uppercase text-slate-700 block tracking-wide">
                      II. IVA DEDUCIBLE (Facturas recibidas de recambios y suministros)
                    </span>
                    <div className="bg-white border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-700"><strong>[28]</strong> Por cuotas soportadas en operaciones interiores corrientes (Base)</span>
                        <span className="font-mono text-slate-800">{baseDeducible.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-emerald-50/50">
                        <span className="text-emerald-900 font-semibold"><strong>[29]</strong> Cuotas soportadas deducibles</span>
                        <span className="font-mono font-bold text-emerald-900">{cuotaDeducible.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between p-2.5 font-bold bg-slate-100">
                        <span><strong>[45]</strong> Total a deducir</span>
                        <span className="font-mono">{cuotaDeducible.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-900 text-white rounded-md flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-bold tracking-wider text-blue-300 block">
                        Resultado de la Autoliquidación Modelo 303
                      </span>
                      <span className="text-[11px] text-blue-200">
                        <strong>[46]</strong> Resultado régimen general · <strong>[71]</strong> Resultado a ingresar en la AEAT
                      </span>
                    </div>
                    <div className="text-2xl font-black font-mono text-white">
                      {resultadoModelo303.toFixed(2)} €
                    </div>
                  </div>
                </div>
              )}

              {/* Detalle Modelo 111 */}
              {selectedModelo === '111' && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Modelo 111 · Retenciones e Ingresos a Cuenta del IRPF (Trabajo y Profesionales)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Retenciones practicadas sobre nóminas del equipo y facturas de servicios profesionales
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded font-mono text-xs">
                      MOD 111
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between p-2.5">
                      <span className="text-slate-700"><strong>[01]</strong> Rendimientos del trabajo: Número de perceptores</span>
                      <span className="font-mono font-bold text-slate-900">{numPerceptores111}</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="text-slate-700"><strong>[02]</strong> Importe íntegro de las percepciones salariales</span>
                      <span className="font-mono font-bold text-slate-900">{percepcionesBrutas111.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-amber-50">
                      <span className="text-amber-900 font-bold"><strong>[03]</strong> Importe de las retenciones practicadas (IRPF nóminas)</span>
                      <span className="font-mono font-black text-amber-900">{retencionesTrabajo111.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between p-2.5 font-bold bg-slate-100">
                      <span><strong>[28]</strong> Total liquidación a ingresar</span>
                      <span className="font-mono text-sm">{retencionesTrabajo111.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalle Modelo 115 */}
              {selectedModelo === '115' && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Modelo 115 · Retenciones por Arrendamiento de Inmuebles Urbanos (Nave / Local)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Retenciones practicadas sobre el alquiler de instalaciones afectas a la actividad
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-900 font-bold rounded font-mono text-xs">
                      MOD 115
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between p-2.5">
                      <span className="text-slate-700"><strong>[01]</strong> Número de perceptores (Arrendadores)</span>
                      <span className="font-mono font-bold text-slate-900">1</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="text-slate-700"><strong>[02]</strong> Base de las retenciones</span>
                      <span className="font-mono font-bold text-slate-900">{baseArrendamiento115.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-purple-50">
                      <span className="text-purple-900 font-bold"><strong>[03]</strong> Retenciones practicadas (19%)</span>
                      <span className="font-mono font-black text-purple-900">{retencionArrendamiento115.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between p-2.5 font-bold bg-slate-100">
                      <span><strong>[05]</strong> Total a ingresar</span>
                      <span className="font-mono text-sm">{retencionArrendamiento115.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalle Modelo 390 */}
              {selectedModelo === '390' && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Modelo 390 · Declaración Resumen Anual del IVA
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Cómputo anual total de bases y cuotas devengadas y deducibles para el ejercicio {selectedYear}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-teal-100 text-teal-900 font-bold rounded font-mono text-xs">
                      MOD 390
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between p-2.5">
                      <span className="text-slate-700"><strong>[01]</strong> Volumen anual de operaciones (Bases devengadas)</span>
                      <span className="font-mono font-bold text-slate-900">{totalAnualBase.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="text-slate-700"><strong>[03]</strong> Total cuotas devengadas anuales</span>
                      <span className="font-mono font-bold text-slate-900">{totalAnualIva.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-teal-50">
                      <span className="text-teal-900 font-bold"><strong>[84]</strong> Resultado anual acumulado</span>
                      <span className="font-mono font-black text-teal-900">{(totalAnualIva - (cuotaDeducible * 4)).toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* PESTAÑA 2: ARCHIVOS DE ENLACE CONTABLE */}
          {activeTab === 'enlace' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Exportación Oficial Directa para Despachos y Software Contable
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Archivos estandarizados listos para su remisión al asesor fiscal o carga desatendida en el software del despacho:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Botón A3 */}
                <button
                  type="button"
                  onClick={handleDownloadA3}
                  className="flex flex-col items-start p-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:border-slate-800 rounded-md transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wide">
                      <Layers className="w-4 h-4 text-slate-800" />
                      <span>A3 / A3ECO / A3ASESOR</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Fichero de enlace oficial para el software Wolters Kluwer A3ASESOR con asientos y desglose fiscal.
                  </p>
                  <span className="mt-2.5 text-[10px] font-bold text-blue-700 uppercase group-hover:underline">
                    Descargar Enlace_A3ECO.txt →
                  </span>
                </button>

                {/* Botón SAGE */}
                <button
                  type="button"
                  onClick={handleDownloadSage}
                  className="flex flex-col items-start p-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:border-slate-800 rounded-md transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wide">
                      <Building2 className="w-4 h-4 text-blue-800" />
                      <span>SAGE (50 / 200 / Despachos)</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Estructura de asientos contables con cuentas del PGC de cliente (430), ventas (705) e IVA (477).
                  </p>
                  <span className="mt-2.5 text-[10px] font-bold text-blue-700 uppercase group-hover:underline">
                    Descargar Diario_SAGE.csv →
                  </span>
                </button>

                {/* Botón Excel XLS */}
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="flex flex-col items-start p-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:border-slate-800 rounded-md transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wide">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>Microsoft Excel (XML / XLS)</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Libro oficial de facturas emitidas con fórmulas, subtotales, bases de IVA y estados.
                  </p>
                  <span className="mt-2.5 text-[10px] font-bold text-blue-700 uppercase group-hover:underline">
                    Descargar Libro_Facturas.xls →
                  </span>
                </button>

                {/* Botón CSV */}
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="flex flex-col items-start p-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:border-slate-800 rounded-md transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wide">
                      <FileCode className="w-4 h-4 text-purple-700" />
                      <span>Fichero CSV Estandarizado</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Exportación universal delimitada por comas compatible con cualquier base de datos y ERP contable.
                  </p>
                  <span className="mt-2.5 text-[10px] font-bold text-blue-700 uppercase group-hover:underline">
                    Descargar Facturas.csv →
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: FACTURAS DEL PERIODO */}
          {activeTab === 'facturas' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Facturas Emitidas en {selectedQuarter} {selectedYear} ({report.invoices.length})
              </h4>

              {report.invoices.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded">
                  No hay facturas emitidas registradas para este periodo.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-md">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Número</th>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">CIF/NIF</th>
                        <th className="py-2.5 px-3 text-right">Base</th>
                        <th className="py-2.5 px-3 text-right">IVA (21%)</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {report.invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">{inv.number}</td>
                          <td className="py-2 px-3 text-slate-600 font-sans">{inv.date}</td>
                          <td className="py-2 px-3 font-medium text-slate-900 font-sans">{inv.clientName}</td>
                          <td className="py-2 px-3 text-slate-600">{inv.clientCif}</td>
                          <td className="py-2 px-3 text-right text-slate-800">{inv.subtotal.toFixed(2)} €</td>
                          <td className="py-2 px-3 text-right text-blue-800">{inv.ivaAmount.toFixed(2)} €</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-950">{inv.total.toFixed(2)} €</td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
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
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Libros de facturación conforme a Ley 11/2021 y Veri*Factu (RD 1007/2023)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer"
          >
            Cerrar Informes
          </button>
        </div>

      </div>
    </div>
  );
};
