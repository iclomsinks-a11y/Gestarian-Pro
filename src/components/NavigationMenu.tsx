import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FolderOpen, Inbox, Users, FileText, 
  Calendar, Wrench, Calculator, PieChart, 
  Truck, AlertTriangle, Settings, X, Sparkles, Plus,
  ArrowLeft, LayoutGrid
} from 'lucide-react';

import { GestarianPlan } from '../types';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onNewBudget?: () => void;
  onNewClient?: () => void;
  bgBentoMenuUrl?: string;
  onOpenImageCustomizer?: () => void;
  onOpenClientLanding?: () => void;
  hasAutoDetectedInvoices?: boolean;
  isScanningInvoices?: boolean;
  scanButtonStatus?: 'idle' | 'scanning' | 'detected' | 'not_found';
  onTriggerScan?: () => void;
  onViewDetectedInvoices?: () => void;
  currentPlan?: GestarianPlan;
  activeEmployeesCount?: number;
}

// Icono +P dentro de una hoja A4 con tamaño ampliado x2
export const A4PlusPIcon: React.FC<{ className?: string }> = ({ className = 'w-16 h-20 sm:w-24 sm:h-28' }) => (
  <svg viewBox="0 0 100 125" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Silueta de hoja A4 con esquina doblada */}
    <path 
      d="M20 10 H68 L86 28 V115 C86 118 83 121 80 121 H20 C17 121 14 118 14 115 V16 C14 13 17 10 20 10 Z" 
      stroke="currentColor" 
      strokeWidth="5" 
      fill="currentColor"
      fillOpacity="0.18"
      strokeLinejoin="round"
    />
    {/* Solapa doblada de la hoja A4 */}
    <path 
      d="M68 10 V28 H86" 
      stroke="currentColor" 
      strokeWidth="5" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.35"
    />
    {/* +P dentro de la hoja */}
    <text 
      x="50" 
      y="84" 
      fill="currentColor" 
      fontSize="42" 
      fontWeight="900" 
      fontFamily="system-ui, -apple-system, sans-serif" 
      textAnchor="middle"
      letterSpacing="-2"
    >
      +P
    </text>
  </svg>
);

// Icono con + y luego el dibujo del cliente ampliado x3
export const PlusClientIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-20 sm:w-36 sm:h-32' }) => (
  <svg viewBox="0 0 130 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Signo + a la izquierda */}
    <text 
      x="28" 
      y="70" 
      fill="currentColor" 
      fontSize="58" 
      fontWeight="900" 
      fontFamily="system-ui, -apple-system, sans-serif" 
      textAnchor="middle"
    >
      +
    </text>
    {/* Cabeza del cliente */}
    <circle cx="88" cy="32" r="18" stroke="currentColor" strokeWidth="6" fill="currentColor" fillOpacity="0.25" />
    {/* Torso del cliente */}
    <path 
      d="M56 88 C56 68 70 56 88 56 C106 56 120 68 120 88" 
      stroke="currentColor" 
      strokeWidth="6" 
      strokeLinecap="round"
      fill="currentColor"
      fillOpacity="0.25"
    />
  </svg>
);

export const allNavItems = [
  { id: 'page-inicio', label: 'Inicio', icon: Home, color: 'bg-emerald-600' },
  { id: 'page-expedientes', label: 'Expedientes', icon: FolderOpen, color: 'bg-blue-600' },
  { id: 'page-solicitudes', label: 'Solicitudes', icon: Inbox, color: 'bg-indigo-600' },
  { id: 'page-clientes', label: 'Clientes', icon: Users, color: 'bg-cyan-600' },
  { id: 'page-presupuestos', label: 'Presupuestos', icon: FileText, color: 'bg-amber-600' },
  { id: 'page-citas', label: 'Citas', icon: Calendar, color: 'bg-rose-600' },
  { id: 'page-taller', label: 'Taller', icon: Wrench, color: 'bg-orange-600' },
  { id: 'page-facturacion', label: 'Facturas', icon: Calculator, color: 'bg-emerald-700' },
  { id: 'page-balances', label: 'Balances', icon: PieChart, color: 'bg-violet-600' },
  { id: 'page-proveedores', label: 'Proveedores', icon: Truck, color: 'bg-slate-600' },
  { id: 'page-equipo', label: 'Mi equipo', icon: Users, color: 'bg-teal-700' },
  { id: 'page-incidencias', label: 'Incidencias', icon: AlertTriangle, color: 'bg-red-600' },
  { id: 'page-configuracion', label: 'Configuración', icon: Settings, color: 'bg-zinc-700' },
];

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  bgBentoMenuUrl,
  onOpenImageCustomizer,
  hasAutoDetectedInvoices = false,
  isScanningInvoices = false,
  scanButtonStatus = 'idle',
  onTriggerScan,
  onViewDetectedInvoices,
  currentPlan,
  activeEmployeesCount = 4,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[100] bg-[#0F172A] flex flex-col p-3 sm:p-5 overflow-hidden select-none"
        >
          {/* Fondo personalizado */}
          {bgBentoMenuUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-30 scale-105 pointer-events-none"
              style={{ backgroundImage: `url(${bgBentoMenuUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/90 via-[#0F172A]/80 to-[#0F172A]/95 backdrop-blur-md pointer-events-none" />

          {/* Cuadrícula Directa de Todas las Secciones ajustada para entrar 100% sin scroll */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex-1 w-full h-full flex flex-col justify-center p-1 sm:p-2 overflow-hidden"
          >
            {/* Cuadrícula Bento con todas las páginas: 3x4 en móvil, 4x3 en tablet/desktop */}
            <div className="w-full h-full max-w-6xl mx-auto grid grid-cols-3 grid-rows-4 sm:grid-cols-4 sm:grid-rows-3 gap-2 sm:gap-3 py-1 items-stretch">
              {allNavItems
                .filter((item) => {
                  if (currentPlan === 'lite') {
                    return item.id === 'page-inicio' || item.id === 'page-presupuestos' || item.id === 'page-facturacion' || item.id === 'page-configuracion';
                  }
                  if (currentPlan === 'quick') {
                    return (
                      item.id === 'page-inicio' ||
                      item.id === 'page-facturacion' ||
                      item.id === 'page-clientes' ||
                      item.id === 'page-proveedores' ||
                      item.id === 'page-balances' ||
                      item.id === 'page-configuracion'
                    );
                  }
                  return true;
                })
                .sort((a, b) => {
                  if (currentPlan === 'quick') {
                    const order = ['page-inicio', 'page-facturacion', 'page-clientes', 'page-proveedores', 'page-balances', 'page-configuracion'];
                    return order.indexOf(a.id) - order.indexOf(b.id);
                  }
                  return 0;
                })
                .map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.012 }}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl ${item.color} text-white shadow-lg hover:scale-[1.03] active:scale-95 transition-all cursor-pointer border border-white/20 group h-full w-full select-none`}
                >
                  {/* Badge de empleados activos para Mi Equipo */}
                  {item.id === 'page-equipo' && (
                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-emerald-400 text-slate-950 font-black text-[9px] rounded-full shadow-xs">
                      {activeEmployeesCount} activos
                    </span>
                  )}
                  <item.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-1 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="font-black text-[11px] sm:text-xs md:text-sm tracking-wider uppercase text-center leading-tight line-clamp-1">
                    {item.label}
                  </span>
                </motion.button>
              ))}

              {/* Botón de Rastrear Facturas con aviso dinámico y diseño llamativo (Solo PRO y ENTERPRISE) */}
              {onTriggerScan && currentPlan !== 'lite' && currentPlan !== 'quick' && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => {
                    if (scanButtonStatus === 'detected') {
                      onViewDetectedInvoices?.();
                      onClose();
                    } else if (scanButtonStatus !== 'scanning') {
                      onTriggerScan();
                      onClose();
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl shadow-lg transition-all cursor-pointer group h-full w-full select-none text-center ${
                    scanButtonStatus === 'detected'
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-lime-400 text-slate-950 font-black shadow-[0_0_35px_rgba(52,211,153,0.95)] border-2 border-white ring-4 ring-emerald-300 animate-pulse hover:scale-[1.06] active:scale-95'
                      : scanButtonStatus === 'not_found'
                      ? 'bg-slate-800 text-slate-300 border border-slate-600'
                      : scanButtonStatus === 'scanning'
                      ? 'bg-emerald-950 text-emerald-200 border border-emerald-500 animate-pulse'
                      : hasAutoDetectedInvoices
                      ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-400 ring-4 ring-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.7)] animate-pulse hover:scale-[1.03] active:scale-95'
                      : 'bg-emerald-800 hover:bg-emerald-700 text-white border border-white/20 hover:scale-[1.03] active:scale-95'
                  }`}
                  title={
                    scanButtonStatus === 'detected'
                      ? "¡Facturas detectadas! Pulse para ver las facturas"
                      : scanButtonStatus === 'not_found'
                      ? "No se han detectado facturas"
                      : "Rastrear facturas en Gmail"
                  }
                >
                  {(scanButtonStatus === 'detected' || hasAutoDetectedInvoices) && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
                    </span>
                  )}
                  <svg className={`w-6 h-6 sm:w-8 sm:h-8 mb-1 group-hover:scale-110 transition-transform shrink-0 ${
                    scanButtonStatus === 'detected' ? 'text-slate-950' : 'text-white'
                  }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    <circle cx="16.5" cy="16.5" r="3.5" stroke="currentColor" strokeWidth={2} />
                    <path d="M19 19L22 22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                  <span className={`tracking-wider uppercase text-center leading-tight line-clamp-2 px-1 ${
                    scanButtonStatus === 'detected'
                      ? 'font-black text-[10px] sm:text-xs text-slate-950'
                      : 'font-black text-[10px] sm:text-xs md:text-sm'
                  }`}>
                    {scanButtonStatus === 'detected'
                      ? "Facturas detectadas, pulse para ver"
                      : scanButtonStatus === 'not_found'
                      ? "No se han detectado facturas"
                      : (scanButtonStatus === 'scanning' || isScanningInvoices)
                      ? "Rastreando..."
                      : "Rastrear Facturas"}
                  </span>
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Barra del menú trasladada al pie, abajo de todos los botones */}
          <div className="relative z-20 w-full flex items-center justify-between pt-2 sm:pt-3 shrink-0 gap-2 border-t border-white/10">
            {/* Lado izquierdo: Casita para ir a inicio + botón de fondos si aplica */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onNavigate('page-inicio');
                  onClose();
                }}
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-emerald-400 hover:text-emerald-300 rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-105 shadow-md cursor-pointer"
                title="Ir a Pantalla de Inicio"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Botón para cambiar fondo solo si NO hay una imagen de fondo personalizada */}
              {onOpenImageCustomizer && !bgBentoMenuUrl && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenImageCustomizer();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold backdrop-blur-md border border-white/20 transition-all hover:scale-105 shadow-md cursor-pointer"
                  title="Personalizar fondo con IA"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span className="hidden sm:inline">Personalizar Fondos</span>
                  <span className="sm:hidden">Fondos</span>
                </button>
              )}
            </div>

            {/* Centro: Título de Todas las Secciones */}
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white/90">
              Todas las Secciones
            </h2>

            {/* Lado derecho: Botón VOLVER icono de flecha a la izquierda sin texto */}
            <button 
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all shadow-lg hover:scale-105 cursor-pointer shrink-0"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
