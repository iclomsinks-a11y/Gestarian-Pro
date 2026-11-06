import React, { useState } from 'react';
import { X, ShieldCheck, Camera, Mail, Check, CheckSquare, Zap, Globe, Wrench, HelpCircle, Sparkles, ChevronRight } from 'lucide-react';
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
  const [maintenanceAlertsEnabled, setMaintenanceAlertsEnabled] = useState<boolean>(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  // Calcular el total dinámicamente según las opciones activas
  const calculateTotalExtras = () => {
    let total = 0;
    if (custodia === 4) total += 10;
    if (custodia === 8) total += 15;
    if (ocrEnabled) total += 19;
    if (emailEnabled) total += 12;
    if (verifactuEnabled) total += 15;
    if (maintenanceAlertsEnabled) total += 60;
    return total;
  };

  // Botón "Seleccionar todo": Activa todas las opciones de pago de golpe
  const handleSelectAll = () => {
    setCustodia(4);
    setOcrEnabled(true);
    setEmailEnabled(true);
    setVerifactuEnabled(true);
    setMaintenanceAlertsEnabled(true);
    onShowToast('Todas las opciones de pago de GESTARIAN QUICK activadas');
  };

  const handleSave = () => {
    const updatedExtras: QuickExtrasConfig = {
      custodiaFiscalAnios: custodia,
      ocrOrganismosEnabled: ocrEnabled,
      emailScannerEnabled: emailEnabled,
      vehicleMaintenanceAlertsEnabled: maintenanceAlertsEnabled,
    };
    onUpdateUser({ 
      currentTier: 'quick',
      enableVehicleMaintenanceAlerts: maintenanceAlertsEnabled,
      quickExtras: updatedExtras 
    });
    onShowToast('Actualización de versión GESTARIAN QUICK confirmada');
    onClose();
  };

  const total = calculateTotalExtras();
  const allSelected = custodia >= 4 && ocrEnabled && emailEnabled && verifactuEnabled && maintenanceAlertsEnabled;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Contenedor Principal con textos tamaño x1.5 */}
      <div className="relative w-full max-w-lg bg-neutral-950 border border-sky-400/90 rounded-2xl shadow-[0_0_40px_rgba(56,189,248,0.3)] flex flex-col max-h-[96dvh] overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Haz luminoso / aura superior estilo Quick */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400 to-transparent pointer-events-none" />
        <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-36 h-[2px] bg-sky-300 rounded-full blur-[2px] shadow-[0_0_15px_#38bdf8]" />

        {/* Cabecera con textos x1.5 */}
        <div className="p-3.5 sm:p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 border border-sky-400/60 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)] shrink-0">
              <Zap className="w-5 h-5 text-sky-400" strokeWidth={1.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extralight text-lg sm:text-xl text-white tracking-[0.18em] uppercase">
                  GESTARIAN QUICK
                </h3>
                <span className="text-xs font-light uppercase tracking-wider px-2 py-0.5 rounded border border-sky-400/60 bg-sky-500/10 text-sky-300">
                  Actualización
                </span>
              </div>
              <p className="text-sm text-neutral-400 font-light leading-tight mt-0.5">
                Ajusta las opciones de pago activadas por defecto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setIsInfoModalOpen(true)}
              className="w-8 h-8 rounded-full border border-sky-400 text-sky-400 hover:text-white hover:bg-sky-400/20 hover:border-sky-300 transition-all flex items-center justify-center font-serif italic font-bold text-sm shadow-[0_0_12px_rgba(56,189,248,0.25)] cursor-pointer shrink-0"
              title="Información detallada de todas las opciones de pago"
            >
              i
            </button>

            <button 
              type="button" 
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" strokeWidth={1.2} />
            </button>
          </div>
        </div>

        {/* Sub-Barra Minimalista con Botón "Seleccionar Todo" (textos x1.5) */}
        <div className="px-4 py-2 bg-neutral-900/90 border-b border-neutral-800/80 flex items-center justify-between gap-3 shrink-0">
          <span className="text-sm font-light text-neutral-300 truncate">
            {allSelected ? '✓ Opciones activas' : 'Toca para activar/desactivar'}
          </span>

          <button
            type="button"
            onClick={handleSelectAll}
            className="py-1.5 px-3 bg-neutral-950 hover:bg-neutral-900 border border-sky-400 text-sky-300 hover:text-white text-xs font-light uppercase tracking-wider rounded-xl shadow-[0_0_12px_rgba(56,189,248,0.25)] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
          >
            <CheckSquare className="w-4 h-4 text-sky-400" strokeWidth={1.2} />
            <span>Seleccionar todo</span>
          </button>
        </div>

        {/* Cuerpo Principal con Opciones en Tamaño x1.5 */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 text-sm text-neutral-200">
          
          {/* Módulo Base Incluido */}
          <div className="p-3 bg-neutral-900/50 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-emerald-400 shrink-0">
                <Check className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div className="truncate">
                <span className="font-light text-white text-base tracking-wide block uppercase truncate">
                  GESTARIAN QUICK (Base)
                </span>
                <span className="text-xs text-neutral-400 font-light block truncate mt-0.5">
                  Clientes, proveedores y facturación con WhatsApp/Email.
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-normal text-emerald-400 uppercase tracking-widest px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg shrink-0">
              0,00 €/año
            </span>
          </div>

          {/* Opción 1: Custodia Fiscal Certificada */}
          <div 
            className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 space-y-1.5 cursor-pointer ${
              custodia >= 4 
                ? 'bg-neutral-900/90 border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.15)]' 
                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setCustodia(custodia >= 4 ? 1 : 4)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <input 
                  type="checkbox"
                  checked={custodia >= 4}
                  onChange={(e) => {
                    e.stopPropagation();
                    setCustodia(e.target.checked ? 4 : 1);
                  }}
                  className="w-4 h-4 accent-sky-400 rounded cursor-pointer shrink-0"
                />
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.2} />
                <span className="font-light text-white text-base uppercase tracking-wider truncate">
                  Custodia Documental Certificada (4 Años)
                </span>
              </div>
              <span className="font-mono text-sky-300 font-light text-xs bg-sky-500/10 border border-sky-400/30 px-2 py-0.5 rounded-lg shrink-0">
                +10,00 €/año
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-light leading-snug pl-7">
              Almacenamiento inalterable exigido por Ley Antifraude y LGT.
            </p>
          </div>

          {/* Opción 2: Lectura OCR por Foto */}
          <div 
            className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 space-y-1.5 cursor-pointer ${
              ocrEnabled 
                ? 'bg-neutral-900/90 border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.15)]' 
                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setOcrEnabled(!ocrEnabled)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <input 
                  type="checkbox"
                  checked={ocrEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setOcrEnabled(e.target.checked);
                  }}
                  className="w-4 h-4 accent-sky-400 rounded cursor-pointer shrink-0"
                />
                <Camera className="w-4 h-4 text-purple-400 shrink-0" strokeWidth={1.2} />
                <span className="font-light text-white text-base uppercase tracking-wider truncate">
                  Lectura OCR por Cámara y Foto de Facturas
                </span>
              </div>
              <span className="font-mono text-purple-300 font-light text-xs bg-purple-500/10 border border-purple-400/30 px-2 py-0.5 rounded-lg shrink-0">
                +19,00 €/año
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-light leading-snug pl-7">
              Digitalización con IA para extraer importes, bases e IVA de recambios.
            </p>
          </div>

          {/* Opción 3: Rastreo de Email */}
          <div 
            className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 space-y-1.5 cursor-pointer ${
              emailEnabled 
                ? 'bg-neutral-900/90 border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.15)]' 
                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setEmailEnabled(!emailEnabled)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <input 
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setEmailEnabled(e.target.checked);
                  }}
                  className="w-4 h-4 accent-sky-400 rounded cursor-pointer shrink-0"
                />
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.2} />
                <span className="font-light text-white text-base uppercase tracking-wider truncate">
                  Rastreo Automático de Facturas en Email
                </span>
              </div>
              <span className="font-mono text-emerald-300 font-light text-xs bg-emerald-500/10 border border-emerald-400/30 px-2 py-0.5 rounded-lg shrink-0">
                +12,00 €/año
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-light leading-snug pl-7">
              Identificación e importación automática de facturas PDF recibidas por correo.
            </p>
          </div>

          {/* Opción 4: Módulo VeriFactu */}
          <div 
            className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 space-y-1.5 cursor-pointer ${
              verifactuEnabled 
                ? 'bg-neutral-900/90 border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.15)]' 
                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setVerifactuEnabled(!verifactuEnabled)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <input 
                  type="checkbox"
                  checked={verifactuEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setVerifactuEnabled(e.target.checked);
                  }}
                  className="w-4 h-4 accent-sky-400 rounded cursor-pointer shrink-0"
                />
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" strokeWidth={1.2} />
                <span className="font-light text-white text-base uppercase tracking-wider truncate">
                  Módulo VeriFactu y Registro AEAT
                </span>
              </div>
              <span className="font-mono text-cyan-300 font-light text-xs bg-cyan-500/10 border border-cyan-400/30 px-2 py-0.5 rounded-lg shrink-0">
                +15,00 €/año
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-light leading-snug pl-7">
              Generación de códigos QR AEAT e huella digital SHA-256 en cada factura.
            </p>
          </div>

          {/* Opción 5: Avisos de Mantenimiento de Vehículos e ITV */}
          <div 
            className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 space-y-1.5 cursor-pointer ${
              maintenanceAlertsEnabled 
                ? 'bg-neutral-900/90 border-amber-400/80 shadow-[0_0_16px_rgba(245,158,11,0.15)]' 
                : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
            }`}
            onClick={() => setMaintenanceAlertsEnabled(!maintenanceAlertsEnabled)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <input 
                  type="checkbox"
                  checked={maintenanceAlertsEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setMaintenanceAlertsEnabled(e.target.checked);
                  }}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer shrink-0"
                />
                <Wrench className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={1.2} />
                <span className="font-light text-white text-base uppercase tracking-wider truncate">
                  Avisos de Mantenimiento de Vehículos e ITV
                </span>
              </div>
              <span className="font-mono text-amber-300 font-light text-xs bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded-lg shrink-0">
                +60,00 €/año
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-light leading-snug pl-7">
              Detección de vencimientos de ITV y revisiones periódicas a 60 días con emisión de presupuesto en 1 clic.
            </p>
          </div>

        </div>

        {/* Footer con Total y Botones con textos x1.5 */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-light uppercase tracking-[0.18em] text-neutral-400 block">
                Total Actualización Quick
              </span>
              <span className="text-xs text-neutral-400 font-light">
                Recalculado dinámicamente
              </span>
            </div>

            <div className="text-right flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extralight font-mono text-sky-400 tracking-tight">
                {total.toFixed(2)} €
              </span>
              <span className="text-xs text-neutral-400 font-light">/ año</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-light uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white text-xs font-light uppercase tracking-[0.15em] rounded-xl border border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 text-sky-400" strokeWidth={1.5} />
              <span>Confirmar y Activar</span>
            </button>
          </div>
        </div>

      </div>

      {/* Ventana Flotante de Información Detallada de Opciones de Pago */}
      {isInfoModalOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInfoModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-sky-400/80 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.35)] flex flex-col max-h-[92dvh] overflow-hidden text-neutral-100 my-auto">
            
            {/* Cabecera */}
            <div className="p-4 sm:p-5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-sky-400 text-sky-400 flex items-center justify-center font-serif italic font-bold text-sm shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                  i
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
                    Funcionalidades y Opciones de Pago — GESTARIAN
                  </h3>
                  <p className="text-xs text-neutral-400 font-light mt-0.5">
                    Detalle completo y ordenado de módulos, coberturas y planes
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con Scroll fluido */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-neutral-300 leading-relaxed font-light">
              
              {/* Sección 1: Base Quick */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Check className="w-4 h-4" /> 1. GESTARIAN QUICK (Base Incluida)
                  </h4>
                  <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">0,00 €/año</span>
                </div>
                <p className="text-neutral-300">
                  Incluye la cartera completa de clientes y proveedores sin límite, facturación simplificada y ordinaria con desglose de IVA, expedición directa de presupuestos, envío inmediato a clientes por WhatsApp y correo electrónico, modo fuera de línea (offline-first) y custodia de base de datos durante el primer año.
                </p>
              </div>

              {/* Sección 2: Avisos de Mantenimiento */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> 2. Avisos de Mantenimiento de Vehículos e ITV
                  </h4>
                  <span className="font-mono text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">+60,00 €/año</span>
                </div>
                <p className="text-neutral-300">
                  Monitorización preventiva de la flota de vehículos de tus clientes. El sistema detecta y anticipa los vencimientos oficiales de ITV y revisiones periódicas con 60 días de margen. Permite contactar al cliente con un toque por WhatsApp, generar automáticamente el presupuesto de revisión y reservar la cita en agenda, garantizando ingresos recurrentes y fidelización.
                </p>
              </div>

              {/* Sección 3: Custodia Fiscal Certificada */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> 3. Custodia Documental Certificada (4 u 8 Años)
                  </h4>
                  <span className="font-mono text-xs text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">+10,00 € (4a) | +15,00 € (8a)</span>
                </div>
                <p className="text-neutral-300">
                  Almacenamiento seguro, inalterable y con sellado temporal en servidores de alta disponibilidad, dando cumplimiento estricto a la Ley Antifraude 11/2021 y a los plazos legales de prescripción de la Ley General Tributaria frente a cualquier inspección de la Agencia Tributaria.
                </p>
              </div>

              {/* Sección 4: Lectura OCR */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4" /> 4. Lectura OCR por Cámara y Foto de Facturas
                  </h4>
                  <span className="font-mono text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">+19,00 €/año</span>
                </div>
                <p className="text-neutral-300">
                  Digitalización instantánea con inteligencia artificial. Basta con fotografiar tickets, albaranes o facturas en papel de proveedores para que el sistema reconozca el CIF, razón social, fecha, bases imponibles y cuotas de IVA, registrando automáticamente el gasto sin necesidad de tecleo manual.
                </p>
              </div>

              {/* Sección 5: Rastreo de Email */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4" /> 5. Rastreo Automático de Facturas en Email (Gmail)
                  </h4>
                  <span className="font-mono text-xs text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">+12,00 €/año</span>
                </div>
                <p className="text-neutral-300">
                  Escaneo inteligente de la bandeja de entrada para detectar albaranes y facturas de compra en PDF enviadas por distribuidores y recambistas, presentándolas para su incorporación con un solo clic.
                </p>
              </div>

              {/* Sección 6: Módulo Veri*Factu */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" /> 6. Módulo Oficial Veri*Factu y Registro AEAT
                  </h4>
                  <span className="font-mono text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/30">+15,00 €/año</span>
                </div>
                <p className="text-neutral-300">
                  Conformidad total con el Real Decreto 1007/2023. Genera en cada factura el código QR oficial de la Agencia Tributaria y el hash de encadenamiento SHA-256 para validación por parte de clientes y Hacienda.
                </p>
              </div>

              {/* Sección 7: Salto a Planes Pro y Enterprise */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 space-y-2">
                <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" /> 7. Planes Avanzados (GESTARIAN PRO & ENTERPRISE)
                </h4>
                <p className="text-neutral-300">
                  <strong>PRO (99 €/año):</strong> Asistente de inteligencia artificial y voz Metis, gestión integral de taller con órdenes de trabajo, operarios, control horario laboral obligatorio y balances financieros en tiempo real.<br/>
                  <strong>ENTERPRISE (199 €/año):</strong> Conexión telemática directa mediante certificado digital con la Sede Electrónica AEAT, red interempresas B2B para transferir expedientes con comisiones y multiempresa.
                </p>
              </div>

            </div>

            {/* Footer de la Ventana Flotante */}
            <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
