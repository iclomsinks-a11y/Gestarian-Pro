import React, { useState } from 'react';
import { UserCheck, FileText, Github, Car, Bell, ChevronDown, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { AppUser, GestarianPlan } from '../types';

interface HeaderProps {
  user: AppUser;
  currentPlan: GestarianPlan;
  onSelectPlan: (plan: GestarianPlan) => void;
  onOpenNewUser: () => void;
  onOpenWorkOrders: () => void;
  onOpenSpec: () => void;
  onOpenPlateScanner: () => void;
  onOpenNotifications: () => void;
  onOpenEnterpriseAeat?: () => void;
  onOpenQuickExtras?: () => void;
  unreadNotificationsCount?: number;
  githubRepoUrl?: string;
  hasPlateRecognizerKey?: boolean;
}

const PLANS_CONFIG: { id: GestarianPlan; label: string; icon: string; desc: string; badge: string }[] = [
  { id: 'lite', label: 'LITE', icon: '🪐', desc: 'Presupuestos y Facturas Directas (Local)', badge: 'Gratis' },
  { id: 'quick', label: 'QUICK', icon: '⚡', desc: 'BD Clientes/Proveedores + Custodia 1a (+10€/1-4a | +15€/4-8a) + Rastreo/OCR (+19€/a)', badge: 'BD + Custodia 1 Año' },
  { id: 'pro', label: 'PRO', icon: '💎', desc: 'Taller + Expedientes + Mi Equipo + Informes AEAT', badge: 'Completo' },
  { id: 'enterprise', label: 'ENTERPRISE', icon: '🏢', desc: 'Ilimitado + Sede AEAT Certificado + Red B2B', badge: 'Corporativo' },
];

export const Header: React.FC<HeaderProps> = ({
  user,
  currentPlan,
  onSelectPlan,
  onOpenNewUser,
  onOpenWorkOrders,
  onOpenSpec,
  onOpenPlateScanner,
  onOpenNotifications,
  onOpenEnterpriseAeat,
  onOpenQuickExtras,
  unreadNotificationsCount = 0,
  githubRepoUrl = 'https://github.com/gestarian/gestarian-core',
  hasPlateRecognizerKey = false,
}) => {
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const activePlanConfig = PLANS_CONFIG.find(p => p.id === currentPlan) || PLANS_CONFIG[2];

  return (
    <header className="w-full border-b border-[#E2E0D8] bg-[#F8F7F3] sticky top-0 z-30 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        
        {/* Lado izquierdo: Gestión Emisores & Escáner Matrículas */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            id="btn-nuevo-usuario-dev"
            onClick={onOpenNewUser}
            title="Panel Desarrollador: Gestión y alta de emisores (autónomos o empresas)"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold uppercase tracking-wider transition-colors duration-150 rounded-sm shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5 stroke-[2]" />
            <span className="hidden sm:inline">Emisores</span>
          </button>

          {/* Selector de Plan / Versión en Cabecera */}
          <div className="relative">
            <button
              id="btn-plan-switcher"
              type="button"
              onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-sm text-xs font-black text-slate-900 transition-colors shadow-2xs cursor-pointer"
              title="Cambiar versión activa de GESTARIAN"
            >
              <span className="text-sm">{activePlanConfig.icon}</span>
              <span className="font-mono tracking-wider">{activePlanConfig.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isPlanDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPlanDropdownOpen && (
              <div 
                className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-300 rounded-md shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Seleccionar Versión de GESTARIAN
                </div>
                {PLANS_CONFIG.map((p) => {
                  const isSelected = p.id === currentPlan;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectPlan(p.id);
                        setIsPlanDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base shrink-0">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{p.label}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Accesos rápidos según versión */}
          {currentPlan === 'enterprise' && onOpenEnterpriseAeat && (
            <button
              onClick={onOpenEnterpriseAeat}
              className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-sm transition-colors cursor-pointer shadow-2xs"
              title="Abrir Sede Electrónica AEAT y Red B2B"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Sede AEAT / B2B</span>
            </button>
          )}

          {currentPlan === 'quick' && onOpenQuickExtras && (
            <button
              onClick={onOpenQuickExtras}
              className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-sm transition-colors cursor-pointer shadow-2xs"
              title="Abrir panel de extras de Quick"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Extras Quick</span>
            </button>
          )}

          {user.verified && (
            <span
              title={`Emisor activo: ${user.fullName} (${user.cif})`}
              className="hidden 2xl:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[#475569] bg-[#EFECE6] rounded-sm border border-[#E2E0D8]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {user.cif}
            </span>
          )}
        </div>

        {/* Centro: Título GESTARIAN minimalista en mayúsculas y dominio */}
        <div className="text-center select-none px-2 min-w-0">
          <h1
            id="header-title-gestarian"
            className="text-xl sm:text-2xl lg:text-3xl font-black tracking-[0.2em] sm:tracking-[0.25em] text-[#0F172A] uppercase truncate"
          >
            GESTARIAN
          </h1>
          <p className="text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#64748B] font-medium leading-none">
            {activePlanConfig.icon} {activePlanConfig.label} · Facturación & Taller
          </p>
        </div>

        {/* Lado derecho: Notificaciones Internas & Órdenes de Trabajo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          <button
            id="btn-header-alpr-scanner"
            onClick={onOpenPlateScanner}
            title="Escanear matrícula con Plate Recognizer"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0F2942] hover:text-[#1E3A8A] bg-white hover:bg-[#FAF9F5] border border-[#CBD5E1] rounded-sm transition-colors shadow-2xs"
          >
            <Car className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span className="hidden lg:inline">ALPR</span>
          </button>

          <button
            id="btn-ver-especificacion"
            onClick={onOpenSpec}
            title="Ver y descargar especificación técnica del sistema"
            className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] bg-transparent hover:bg-[#EFECE6] border border-[#D5D2C9] rounded-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Doc</span>
          </button>

          {/* Notificaciones internas */}
          <button
            id="btn-header-notificaciones"
            onClick={onOpenNotifications}
            title="Notificaciones internas del sistema"
            className="relative inline-flex items-center justify-center p-2 text-[#0F2942] hover:text-[#1E3A8A] bg-white hover:bg-[#FAF9F5] border border-[#CBD5E1] rounded-sm transition-colors shadow-2xs"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-xs animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Órdenes de trabajo: solo visible si el plan no es LITE */}
          {currentPlan !== 'lite' && (
            <button
              id="btn-ordenes-trabajo"
              onClick={onOpenWorkOrders}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F5] hover:bg-[#EFECE6] text-[#0F172A] border border-[#CBD5E1] text-xs font-semibold uppercase tracking-wider transition-colors duration-150 rounded-sm shadow-xs"
            >
              <span className="hidden sm:inline">Órdenes</span>
              <span className="sm:hidden">OTs</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

