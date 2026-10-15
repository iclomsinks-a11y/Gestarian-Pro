import React, { useState } from 'react';
import { X, ShieldCheck, Camera, Mail, Check, CheckSquare, Zap, Globe } from 'lucide-react';
import { AppUser, QuickExtrasConfig } from '../types';

interface QuickExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onUpdateUser: (updatedFields: Partial<AppUser>) => void;
  onShowToast: (msg: string) => void;
}

export const QuickExtrasModal: React.FC<QuickExtrasModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onShowToast,
}) => {
  if (!isOpen) return null;

  // Por defecto al entrar en la pantalla de actualización, TODAS las opciones de pago vienen ACTIVADAS (true)
  const [custodia, setCustodia] = useState<1 | 4 | 8>(4);
  const [ocrEnabled, setOcrEnabled] = useState<boolean>(true);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(true);
  const [verifactuEnabled, setVerifactuEnabled] = useState<boolean>(true);

  // Calcular el total dinámicamente según las opciones activas
  const calculateTotalExtras = () => {
    let total = 0;
    if (custodia === 4) total += 10;
    if (custodia === 8) total += 15;
    if (ocrEnabled) total += 19;
    if (emailEnabled) total += 12;
    if (verifactuEnabled) total += 15;
    return total;
  };

  // Botón "Seleccionar todo": Activa todas las opciones de pago de golpe
  const handleSelectAll = () => {
    setCustodia(4);
    setOcrEnabled(true);
    setEmailEnabled(true);
    setVerifactuEnabled(true);
    onShowToast('Todas las opciones de pago de GESTARIAN QUICK activadas');
  };

  const handleSave = () => {
    const updatedExtras: QuickExtrasConfig = {
      custodiaFiscalAnios: custodia,
      ocrOrganismosEnabled: ocrEnabled,
      emailScannerEnabled: emailEnabled,
    };
    onUpdateUser({ 
      tier: 'quick',
      quickExtras: updatedExtras 
    });
    onShowToast('Actualización de versión GESTARIAN QUICK confirmada');
    onClose();
  };

  const total = calculateTotalExtras();
  const allSelected = custodia >= 4 && ocrEnabled && emailEnabled && verifactuEnabled;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Contenedor Principal Ajustado al Display Móvil Portrait (sin desbordamiento ni scroll) */}
      <div className="relative w-full max-w-md bg-neutral-950 border border-sky-400/90 rounded-xl shadow-[0_0_30px_rgba(56,189,248,0.25)] flex flex-col max-h-[96dvh] overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Haz luminoso / aura superior estilo Quick */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400 to-transparent pointer-events-none" />
        <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-28 h-[2px] bg-sky-300 rounded-full blur-[2px] shadow-[0_0_10px_#38bdf8]" />

        {/* Cabecera Ultra Compacta */}
        <div className="p-2.5 sm:p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neutral-900 border border-sky-400/60 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)] shrink-0">
              <Zap className="w-4 h-4 text-sky-400" strokeWidth={1} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extralight text-sm sm:text-base text-white tracking-[0.18em] uppercase">
                  GESTARIAN QUICK
                </h3>
                <span className="text-[9px] font-extralight uppercase tracking-wider px-1.5 py-0.2 rounded border border-sky-400/60 bg-sky-500/10 text-sky-300">
                  Actualización
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-light leading-none mt-0.5">
                Ajusta las opciones de pago activadas por defecto
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={1} />
          </button>
        </div>

        {/* Sub-Barra Minimalista con Botón "Seleccionar Todo" */}
        <div className="px-3 py-1.5 bg-neutral-900/90 border-b border-neutral-800/80 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] font-light text-neutral-300 truncate">
            {allSelected ? '✓ Opciones activas' : 'Toca para activar/desactivar'}
          </span>

          <button
            type="button"
            onClick={handleSelectAll}
            className="py-1 px-2.5 bg-neutral-950 hover:bg-neutral-900 border border-sky-400 text-sky-300 hover:text-white text-[10px] font-extralight uppercase tracking-wider rounded-lg shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
          >
            <CheckSquare className="w-3 h-3 text-sky-400" strokeWidth={1} />
            <span>Seleccionar todo</span>
          </button>
        </div>

        {/* Cuerpo Principal con Opciones en Tamaño Ajustado */}
        <div className="p-2.5 sm:p-3 overflow-y-auto space-y-2 text-xs text-neutral-200">
          
          {/* Módulo Base Incluido */}
          <div className="p-2 bg-neutral-900/50 border border-emerald-500/30 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 bg-emerald-500/10 border border-emerald-500/40 rounded text-emerald-400 shrink-0">
                <Check className="w-3 h-3" strokeWidth={1.5} />
              </div>
              <div className="truncate">
                <span className="font-extralight text-white text-[11px] tracking-wide block uppercase truncate">
                  GESTARIAN QUICK (Base)
                </span>
                <span className="text-[9.5px] text-neutral-400 font-light block truncate">
                  Clientes, proveedores y facturación con WhatsApp/Email.
                </span>
              </div>
            </div>
            <span className="text-[9.5px] font-mono font-normal text-emerald-400 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded shrink-0">
              0,00 €/año
            </span>
          </div>

          {/* Opción 1: Custodia Fiscal Certificada */}
          <div 
            className={`p-2 sm:p-2.5 rounded-lg border transition-all duration-200 space-y-1 cursor-pointer ${
              custodia >= 4 
                ? 'bg-neutral-900/90 border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.12)]' 
                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setCustodia(custodia >= 4 ? 1 : 4)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <input 
                  type="checkbox"
                  checked={custodia >= 4}
                  onChange={(e) => {
                    e.stopPropagation();
                    setCustodia(e.target.checked ? 4 : 1);
                  }}
                  className="w-3.5 h-3.5 accent-sky-400 rounded cursor-pointer shrink-0"
                />
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" strokeWidth={1} />
                <span className="font-extralight text-white text-[11px] uppercase tracking-wider truncate">
                  Custodia Documental Certificada (4 Años)
                </span>
              </div>
              <span className="font-mono text-sky-300 font-light text-[10px] bg-sky-500/10 border border-sky-400/30 px-1.5 py-0.2 rounded shrink-0">
                +10,00 €/año
              </span>
            </div>
            <p className="text-[9.5px] text-neutral-400 font-light leading-tight pl-5">
              Almacenamiento inalterable exigido por Ley Antifraude y LGT.
            </p>
          </div>

          {/* Opción 2: Lectura OCR por Foto */}
          <div 
            className={`p-2 sm:p-2.5 rounded-lg border transition-all duration-200 space-y-1 cursor-pointer ${
              ocrEnabled 
                ? 'bg-neutral-900/90 border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.12)]' 
                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setOcrEnabled(!ocrEnabled)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <input 
                  type="checkbox"
                  checked={ocrEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setOcrEnabled(e.target.checked);
                  }}
                  className="w-3.5 h-3.5 accent-sky-400 rounded cursor-pointer shrink-0"
                />
                <Camera className="w-3.5 h-3.5 text-purple-400 shrink-0" strokeWidth={1} />
                <span className="font-extralight text-white text-[11px] uppercase tracking-wider truncate">
                  Lectura OCR por Cámara y Foto de Facturas
                </span>
              </div>
              <span className="font-mono text-purple-300 font-light text-[10px] bg-purple-500/10 border border-purple-400/30 px-1.5 py-0.2 rounded shrink-0">
                +19,00 €/año
              </span>
            </div>
            <p className="text-[9.5px] text-neutral-400 font-light leading-tight pl-5">
              Digitalización con IA para extraer importes, bases e IVA de recambios.
            </p>
          </div>

          {/* Opción 3: Rastreo de Email */}
          <div 
            className={`p-2 sm:p-2.5 rounded-lg border transition-all duration-200 space-y-1 cursor-pointer ${
              emailEnabled 
                ? 'bg-neutral-900/90 border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.12)]' 
                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setEmailEnabled(!emailEnabled)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <input 
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setEmailEnabled(e.target.checked);
                  }}
                  className="w-3.5 h-3.5 accent-sky-400 rounded cursor-pointer shrink-0"
                />
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1} />
                <span className="font-extralight text-white text-[11px] uppercase tracking-wider truncate">
                  Rastreo Automático de Facturas en Email
                </span>
              </div>
              <span className="font-mono text-emerald-300 font-light text-[10px] bg-emerald-500/10 border border-emerald-400/30 px-1.5 py-0.2 rounded shrink-0">
                +12,00 €/año
              </span>
            </div>
            <p className="text-[9.5px] text-neutral-400 font-light leading-tight pl-5">
              Identificación e importación automática de facturas PDF recibidas por correo.
            </p>
          </div>

          {/* Opción 4: Módulo VeriFactu */}
          <div 
            className={`p-2 sm:p-2.5 rounded-lg border transition-all duration-200 space-y-1 cursor-pointer ${
              verifactuEnabled 
                ? 'bg-neutral-900/90 border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.12)]' 
                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setVerifactuEnabled(!verifactuEnabled)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <input 
                  type="checkbox"
                  checked={verifactuEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setVerifactuEnabled(e.target.checked);
                  }}
                  className="w-3.5 h-3.5 accent-sky-400 rounded cursor-pointer shrink-0"
                />
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" strokeWidth={1} />
                <span className="font-extralight text-white text-[11px] uppercase tracking-wider truncate">
                  Módulo VeriFactu y Registro AEAT
                </span>
              </div>
              <span className="font-mono text-cyan-300 font-light text-[10px] bg-cyan-500/10 border border-cyan-400/30 px-1.5 py-0.2 rounded shrink-0">
                +15,00 €/año
              </span>
            </div>
            <p className="text-[9.5px] text-neutral-400 font-light leading-tight pl-5">
              Generación de códigos QR AEAT e huella digital SHA-256 en cada factura.
            </p>
          </div>

        </div>

        {/* Footer Compacto con Total y Botones Unificados para Visibilidad en 1 Pantalla Móvil */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-extralight uppercase tracking-[0.18em] text-neutral-400 block">
                Total Actualización Quick
              </span>
              <span className="text-[9.5px] text-neutral-400 font-light">
                Recalculado dinámicamente
              </span>
            </div>

            <div className="text-right flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extralight font-mono text-sky-400 tracking-tight">
                {total.toFixed(2)} €
              </span>
              <span className="text-[10px] text-neutral-400 font-light">/ año</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[10px] font-extralight uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white text-[10px] font-extralight uppercase tracking-[0.15em] rounded-lg border border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.25)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.5} />
              <span>Confirmar y Activar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
