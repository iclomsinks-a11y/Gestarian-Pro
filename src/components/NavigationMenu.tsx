import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FolderOpen, Inbox, Users, FileText, 
  Calendar, Wrench, Calculator, PieChart, 
  Truck, AlertTriangle, Settings, X, Sparkles, Plus,
  ArrowLeft, LayoutGrid
} from 'lucide-react';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onNewBudget?: () => void;
  onNewClient?: () => void;
  bgBentoMenuUrl?: string;
  onOpenImageCustomizer?: () => void;
  onOpenClientLanding?: () => void;
}

// Icono +P dentro de una hoja A4 con tamaño ampliado x2
const A4PlusPIcon: React.FC<{ className?: string }> = ({ className = 'w-16 h-20 sm:w-24 sm:h-28' }) => (
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
const PlusClientIcon: React.FC<{ className?: string }> = ({ className = 'w-24 h-20 sm:w-36 sm:h-32' }) => (
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

const allNavItems = [
  { id: 'page-inicio', label: 'Inicio', icon: Home, color: 'bg-emerald-600' },
  { id: 'page-expedientes', label: 'Expedientes', icon: FolderOpen, color: 'bg-blue-600' },
  { id: 'page-solicitudes', label: 'Solicitudes', icon: Inbox, color: 'bg-indigo-600' },
  { id: 'page-clientes', label: 'Clientes', icon: Users, color: 'bg-cyan-600' },
  { id: 'page-presupuestos', label: 'Presupuestos', icon: FileText, color: 'bg-amber-600' },
  { id: 'page-citas', label: 'Citas', icon: Calendar, color: 'bg-rose-600' },
  { id: 'page-taller', label: 'Taller', icon: Wrench, color: 'bg-orange-600' },
  { id: 'page-facturacion', label: 'Facturación', icon: Calculator, color: 'bg-emerald-700' },
  { id: 'page-balances', label: 'Balances', icon: PieChart, color: 'bg-violet-600' },
  { id: 'page-proveedores', label: 'Proveedores', icon: Truck, color: 'bg-slate-600' },
  { id: 'page-incidencias', label: 'Incidencias', icon: AlertTriangle, color: 'bg-red-600' },
  { id: 'page-configuracion', label: 'Configuración', icon: Settings, color: 'bg-zinc-700' },
];

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNewBudget,
  onNewClient,
  bgBentoMenuUrl,
  onOpenImageCustomizer,
  onOpenClientLanding,
}) => {
  const [bentoScreen, setBentoScreen] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) {
      setBentoScreen(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (bentoScreen === 2) {
          setBentoScreen(1);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, bentoScreen, onClose]);

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
          className="fixed inset-0 z-[100] bg-[#0F172A] flex flex-col p-4 sm:p-6 overflow-hidden select-none"
        >
          {/* Fondo personalizado */}
          {bgBentoMenuUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-30 scale-105 pointer-events-none"
              style={{ backgroundImage: `url(${bgBentoMenuUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/90 via-[#0F172A]/80 to-[#0F172A]/95 backdrop-blur-md pointer-events-none" />

          {/* Barra superior solo en Pantalla 1: Casita de inicio a la izquierda y flecha VOLVER sin texto a la derecha */}
          {bentoScreen === 1 && (
            <div className="relative z-20 w-full flex items-center justify-between pb-3 shrink-0 gap-2 border-b border-white/10">
              {/* Lado izquierdo: Casita para ir a inicio + botón de fondos si aplica */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('page-inicio');
                    onClose();
                  }}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-emerald-400 hover:text-emerald-300 rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-105 shadow-md cursor-pointer"
                  title="Ir a Pantalla de Inicio"
                >
                  <Home className="w-5 h-5" />
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
                    title="Personalizar fondo con IA (por defecto)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span className="hidden sm:inline">Personalizar Fondos</span>
                    <span className="sm:hidden">Fondos</span>
                  </button>
                )}

                {onOpenClientLanding && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenClientLanding();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 text-[#38BDF8] rounded-full text-xs font-bold backdrop-blur-md border border-[#38BDF8]/40 transition-all hover:scale-105 shadow-md cursor-pointer"
                    title="Ver Portal de Clientes"
                  >
                    <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span className="hidden sm:inline">Portal Clientes</span>
                  </button>
                )}
              </div>

              {/* Lado derecho: Botón VOLVER icono de flecha a la izquierda sin texto */}
              <button 
                type="button"
                onClick={onClose}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all shadow-lg hover:scale-105 cursor-pointer shrink-0"
                title="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* PANTALLA 1: Botón Nuevo Presupuesto (+P en A4 x2), Botón Nuevo Cliente (+ y cliente x3), Botón Todas las Secciones (+ x2) */}
          {bentoScreen === 1 && (
            <motion.div 
              key="screen-1"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 flex-1 w-full flex flex-col justify-between py-2 sm:py-4"
            >
              {/* Botones Grandes Principales */}
              <div className="flex-1 w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center my-auto py-2">
                {/* 1. Botón Grande de Nuevo Presupuesto (+P dentro de hoja A4 tamaño x2) */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNewBudget) {
                      onNewBudget();
                    } else {
                      onNavigate('page-presupuestos');
                    }
                  }}
                  className="group flex flex-col items-center justify-center p-6 sm:p-8 h-44 sm:h-72 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] border border-amber-300/40 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 group-hover:rotate-3 transition-transform">
                    <A4PlusPIcon className="w-20 h-24 sm:w-28 sm:h-32 text-white drop-shadow-md" />
                  </div>
                  <span className="font-black text-base sm:text-xl tracking-wider uppercase text-center leading-tight">
                    Nuevo Presupuesto
                  </span>
                </button>

                {/* 2. Botón Grande de Nuevo Cliente (+ y luego dibujo del cliente tamaño x3) */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNewClient) {
                      onNewClient();
                    } else {
                      onNavigate('page-clientes');
                    }
                  }}
                  className="group flex flex-col items-center justify-center p-6 sm:p-8 h-44 sm:h-72 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_40px_rgba(6,182,212,0.5)] border border-cyan-300/40 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 group-hover:-rotate-3 transition-transform">
                    <PlusClientIcon className="w-28 h-24 sm:w-36 sm:h-32 text-white drop-shadow-md" />
                  </div>
                  <span className="font-black text-base sm:text-xl tracking-wider uppercase text-center leading-tight">
                    Nuevo Cliente
                  </span>
                </button>

                {/* 3. Botón Grande de TODAS LAS SECCIONES (icono x2) */}
                <button
                  type="button"
                  onClick={() => setBentoScreen(2)}
                  className="group flex flex-col items-center justify-center p-6 sm:p-8 h-44 sm:h-72 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.5)] border border-indigo-300/40 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-white/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-14 h-14 sm:w-20 sm:h-20 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="font-black text-base sm:text-xl tracking-wider uppercase text-center leading-tight">
                    Todas las Secciones
                  </span>
                </button>
              </div>

              {/* Botón de Volver a Pantalla de Inicio en Bento 1 */}
              <div className="w-full flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('page-inicio');
                    onClose();
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border border-white/20 transition-all hover:scale-105 cursor-pointer shadow-lg"
                >
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span>Volver a Pantalla de Inicio</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* PANTALLA 2: Cuadrícula de Todas las Secciones ajustada para entrar 100% sin scroll */}
          {bentoScreen === 2 && (
            <motion.div 
              key="screen-2"
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -30 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 flex-1 w-full h-full flex flex-col justify-center p-1 sm:p-2 overflow-hidden"
            >
              {/* Cuadrícula Bento con todas las páginas: 3x4 en móvil, 4x3 en tablet/desktop */}
              <div className="w-full h-full max-w-6xl mx-auto grid grid-cols-3 grid-rows-4 sm:grid-cols-4 sm:grid-rows-3 gap-2 sm:gap-3 py-1 items-stretch">
                {allNavItems.map((item, i) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.015 }}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl ${item.color} text-white shadow-lg hover:scale-[1.03] active:scale-95 transition-all cursor-pointer border border-white/20 group h-full w-full select-none`}
                  >
                    <item.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-1 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="font-black text-[11px] sm:text-xs md:text-sm tracking-wider uppercase text-center leading-tight line-clamp-1">
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
