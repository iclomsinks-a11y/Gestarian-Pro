import React from 'react';
import { UserCheck, FileText, Github, Car, Bell } from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  user: AppUser;
  onOpenNewUser: () => void;
  onOpenWorkOrders: () => void;
  onOpenSpec: () => void;
  onOpenPlateScanner: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  githubRepoUrl?: string;
  hasPlateRecognizerKey?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenNewUser,
  onOpenWorkOrders,
  onOpenSpec,
  onOpenPlateScanner,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  githubRepoUrl = 'https://github.com/gestarian/gestarian-core',
  hasPlateRecognizerKey = false,
}) => {
  return (
    <header className="w-full border-b border-[#E2E0D8] bg-[#F8F7F3] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Lado izquierdo: Gestión Emisores & Escáner Matrículas */}
        <div className="flex items-center gap-2 sm:gap-3">

          <button
            id="btn-nuevo-usuario-dev"
            onClick={onOpenNewUser}
            title="Panel Desarrollador: Gestión y alta de emisores (autónomos o empresas)"
            className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold uppercase tracking-wider transition-colors duration-150 rounded-sm shadow-sm"
          >
            <UserCheck className="w-4 h-4 stroke-[2]" />
            <span className="hidden sm:inline">Gestión Emisores</span>
            <span className="sm:hidden">Emisores</span>
          </button>

          <button
            id="btn-header-alpr-scanner"
            onClick={onOpenPlateScanner}
            title="Escanear matrícula con Plate Recognizer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F2942] hover:text-[#1E3A8A] bg-white hover:bg-[#FAF9F5] border border-[#CBD5E1] rounded-sm transition-colors shadow-xs"
          >
            <Car className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span className="hidden md:inline">Plate Recognizer</span>
            <span className="md:hidden">ALPR</span>
          </button>

          {user.verified && (
            <span
              title={`Emisor activo: ${user.fullName} (${user.cif})`}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#475569] bg-[#EFECE6] rounded-sm border border-[#E2E0D8]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {user.cif}
            </span>
          )}
        </div>

        {/* Centro: Título GESTARIAN minimalista en mayúsculas y dominio */}
        <div className="text-center select-none px-2">
          <h1
            id="header-title-gestarian"
            className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-[#0F172A] uppercase"
          >
            GESTARIAN
          </h1>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#64748B] font-medium mt-0.5">
            Presupuestos & Facturación Fiscal
          </p>
        </div>

        {/* Lado derecho: GitHub Repo, Notificaciones Internas & Órdenes de Trabajo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            id="link-github-repo"
            href={githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Ver repositorio en GitHub (${githubRepoUrl})`}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-[#0F2942] hover:text-[#1E3A8A] bg-white hover:bg-[#FAF9F5] border border-[#D5D2C9] rounded-sm transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">GitHub</span>
          </a>

          <button
            id="btn-ver-especificacion"
            onClick={onOpenSpec}
            title="Ver y descargar especificación técnica del sistema"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-[#475569] hover:text-[#0F172A] bg-transparent hover:bg-[#EFECE6] border border-[#D5D2C9] rounded-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Doc</span>
          </button>

          {/* Notificaciones internas de cambios de estado de OTs */}
          <button
            id="btn-header-notificaciones"
            onClick={onOpenNotifications}
            title="Notificaciones internas del sistema (cambios de estado de órdenes de trabajo)"
            className="relative inline-flex items-center justify-center p-2 text-[#0F2942] hover:text-[#1E3A8A] bg-white hover:bg-[#FAF9F5] border border-[#CBD5E1] rounded-sm transition-colors shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-xs animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            id="btn-ordenes-trabajo"
            onClick={onOpenWorkOrders}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-[#FAF9F5] hover:bg-[#EFECE6] text-[#0F172A] border border-[#CBD5E1] text-xs font-semibold uppercase tracking-wider transition-colors duration-150 rounded-sm shadow-sm"
          >
            <span className="hidden sm:inline">Órdenes Trabajo</span>
            <span className="sm:hidden">OTs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
