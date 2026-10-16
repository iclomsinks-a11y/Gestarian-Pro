import React, { useRef } from 'react';
import { X, Download, Printer, Shield, FileText, CheckCircle2, Building, User } from 'lucide-react';
import { Employee } from '../types';

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  companyName: string;
  companyCif: string;
  companyAddress: string;
}

export const PayrollModal: React.FC<PayrollModalProps> = ({
  isOpen,
  onClose,
  employee,
  companyName,
  companyCif,
  companyAddress,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !employee) return null;

  const currentMonthYear = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const formattedPeriod = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);

  const baseSalary = employee.salaryMonthly || 1900;
  const plusConvenio = 120;
  const totalDevengado = baseSalary + plusConvenio;

  // Deducciones del Trabajador
  const cuotaContingenciasComunes = Number((totalDevengado * 0.047).toFixed(2));
  const cuotaDesempleo = Number((totalDevengado * 0.0155).toFixed(2));
  const cuotaFormacion = Number((totalDevengado * 0.0010).toFixed(2));
  const cuotaMei = Number((totalDevengado * 0.0012).toFixed(2));
  const totalSeguridadSocialTrabajador = Number((cuotaContingenciasComunes + cuotaDesempleo + cuotaFormacion + cuotaMei).toFixed(2));

  const irpfPct = employee.irpfRate || 12;
  const retencionIrpf = Number((totalDevengado * (irpfPct / 100)).toFixed(2));
  const totalDeducciones = Number((totalSeguridadSocialTrabajador + retencionIrpf).toFixed(2));

  const liquidoPercibir = Number((totalDevengado - totalDeducciones).toFixed(2));

  // Aportación Empresarial (Coste Seguridad Social Empresa)
  const ssEmpresaCC = Number((totalDevengado * 0.236).toFixed(2));
  const ssEmpresaAtep = Number((totalDevengado * 0.036).toFixed(2));
  const ssEmpresaDesempleo = Number((totalDevengado * 0.055).toFixed(2));
  const ssEmpresaFogasa = Number((totalDevengado * 0.002).toFixed(2));
  const ssEmpresaFp = Number((totalDevengado * 0.006).toFixed(2));
  const ssEmpresaMei = Number((totalDevengado * 0.0058).toFixed(2));
  const totalCosteSsEmpresa = Number((ssEmpresaCC + ssEmpresaAtep + ssEmpresaDesempleo + ssEmpresaFogasa + ssEmpresaFp + ssEmpresaMei).toFixed(2));
  const costeTotalEmpresa = Number((totalDevengado + totalCosteSsEmpresa).toFixed(2));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl my-6 bg-white border border-slate-300 rounded-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del modal */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">Recibo Individual de Salarios (Nómina)</h2>
              <p className="text-[11px] text-slate-400">Orden de 27 de diciembre de 1994 · Ministerio de Trabajo y Seguridad Social</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md transition-colors border border-slate-700 cursor-pointer"
              title="Imprimir o guardar PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible de la nómina */}
        <div ref={printRef} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          
          {/* Bloque Empresa y Trabajador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
            {/* Empresa */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>Empresa / Emisor</span>
              </div>
              <div className="font-bold text-sm text-slate-900">{companyName}</div>
              <div className="text-slate-600">CIF: <span className="font-mono font-medium">{companyCif}</span></div>
              <div className="text-slate-500 text-[11px] truncate">{companyAddress}</div>
              <div className="text-[11px] text-slate-500 mt-1">CCC: 28/1234567/89 · Régimen General</div>
            </div>

            {/* Trabajador */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Trabajador / Empleado</span>
              </div>
              <div className="font-bold text-sm text-slate-900">{employee.name}</div>
              <div className="text-slate-600">DNI/NIE: <span className="font-mono font-medium">{employee.dni || 'No asignado'}</span></div>
              <div className="text-slate-600 truncate">{employee.profession || 'Oficial de taller'}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {employee.cotizacionGroup || 'Grupo 8'} · CNO: {employee.cnoCode || '7313'}
              </div>
            </div>
          </div>

          {/* Periodo de liquidación */}
          <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-100 rounded-md text-slate-700 font-medium">
            <span>Periodo de Liquidación: <strong className="text-slate-900">{formattedPeriod}</strong></span>
            <span>Total días: <strong className="text-slate-900">30</strong> · Jornada: <strong className="text-slate-900">{employee.workHoursType === 'media' ? 'Media (80h/mes)' : 'Completa (160h/mes)'}</strong></span>
          </div>

          {/* I. DEVENGOS */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>I. DEVENGOS (Percepciones Salariales)</span>
              <span>Importe (€)</span>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">1. Salario Base mensual</span>
                <span className="font-mono font-medium">{baseSalary.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">2. Complementos salariales (Plus convenio sectorial)</span>
                <span className="font-mono font-medium">{plusConvenio.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-slate-50 px-2 rounded">
                <span>A. TOTAL DEVENGADO (Salario Bruto)</span>
                <span className="font-mono text-sm">{totalDevengado.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* II. DEDUCCIONES */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>II. DEDUCCIONES</span>
              <span>Importe (€)</span>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-slate-600">1. Aportación del trabajador a las cotizaciones de la Seguridad Social:</div>
              <div className="flex justify-between pl-3 py-0.5 text-slate-600">
                <span>• Contingencias comunes (4,70%)</span>
                <span className="font-mono">{cuotaContingenciasComunes.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between pl-3 py-0.5 text-slate-600">
                <span>• Desempleo (1,55%)</span>
                <span className="font-mono">{cuotaDesempleo.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between pl-3 py-0.5 text-slate-600">
                <span>• Formación profesional (0,10%)</span>
                <span className="font-mono">{cuotaFormacion.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between pl-3 py-0.5 text-slate-600">
                <span>• Mecanismo de Equidad Intergeneracional MEI (0,12%)</span>
                <span className="font-mono">{cuotaMei.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between pl-3 py-1 font-medium text-slate-800 bg-slate-50/70 rounded pr-1">
                <span>Total Aportaciones Seguridad Social</span>
                <span className="font-mono">{totalSeguridadSocialTrabajador.toFixed(2)} €</span>
              </div>

              <div className="pt-2 text-[11px] font-semibold text-slate-600">2. Impuesto sobre la Renta de las Personas Físicas (IRPF):</div>
              <div className="flex justify-between pl-3 py-0.5 text-slate-600">
                <span>• Retención a cuenta del IRPF ({irpfPct}%)</span>
                <span className="font-mono font-medium text-rose-700">{retencionIrpf.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-slate-50 px-2 rounded mt-2">
                <span>B. TOTAL A DEDUCIR</span>
                <span className="font-mono text-sm text-rose-700">{totalDeducciones.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* LÍQUIDO A PERCIBIR (NETO) */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider block">Líquido Total a Percibir</span>
              <span className="text-xs text-emerald-700">Transferencia neta a favor del empleado</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-900">
              {liquidoPercibir.toFixed(2)} €
            </div>
          </div>

          {/* DETERMINACIÓN DE BASES Y APORTACIÓN EMPRESARIAL */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Determinación de las Bases de Cotización y Aportación de la Empresa
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="p-2 bg-white border border-slate-200 rounded">
                <span className="text-slate-500 block text-[10px]">Base CC</span>
                <span className="font-mono font-bold text-slate-800">{totalDevengado.toFixed(2)} €</span>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded">
                <span className="text-slate-500 block text-[10px]">Base AT / Desempleo</span>
                <span className="font-mono font-bold text-slate-800">{totalDevengado.toFixed(2)} €</span>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded">
                <span className="text-slate-500 block text-[10px]">Seguridad Social Empresa</span>
                <span className="font-mono font-bold text-slate-800">{totalCosteSsEmpresa.toFixed(2)} €</span>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded">
                <span className="text-slate-500 block text-[10px]">Coste Total Empresa</span>
                <span className="font-mono font-bold text-slate-900">{costeTotalEmpresa.toFixed(2)} €</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight pt-1">
              * Aportación empresarial: Contingencias comunes (23,60%), AT/EP ({employee.accidentsEpigrafe || '3,60%'}), Desempleo (5,50%), FOGASA (0,20%), Formación (0,60%) y MEI (0,58%).
            </p>
          </div>

        </div>

        {/* Pie del modal */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Epígrafe: {employee.epigrafeActividad || 'Epígrafe 691.2'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer"
          >
            Cerrar Nómina
          </button>
        </div>

      </div>
    </div>
  );
};
