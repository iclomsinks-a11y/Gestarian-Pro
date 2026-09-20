import React from 'react';
import { ArrowLeft, Home, Menu } from 'lucide-react';

const PAGES = [
  'page-expedientes',
  'page-solicitudes',
  'page-clientes',
  'page-presupuestos',
  'page-citas',
  'page-taller',
  'page-facturacion',
  'page-balances',
  'page-proveedores',
  'page-incidencias',
  'page-configuracion'
];

interface PageHeaderProps {
  pageId?: string;
  title: string;
  onOpenMenu?: () => void;
  onBack?: () => void;
  onNavigateHome?: () => void;
  logoUrl?: string;
  userFullName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  pageId,
  title,
  onOpenMenu,
  onBack,
  onNavigateHome,
}) => {
  return (
    <div className="w-full mb-6 sm:mb-8 shrink-0 flex flex-col gap-4 border-b-2 border-[#E2E0D8] pb-4">
      <div className="flex items-center justify-between gap-4">
        
        {/* Lado Izquierdo: Menú Vento y Volver */}
        <div className="flex items-center gap-2 sm:gap-3 w-1/4">
          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex items-center justify-center p-2 rounded-lg hover:ring-2 hover:ring-[#38BDF8] bg-white border border-[#CBD5E1] text-[#0F2942] hover:bg-[#F1F5F9] transition-all cursor-pointer shadow-sm"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[#0F2942] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm group shrink-0"
              title="Volver a la pantalla anterior"
            >
              <ArrowLeft className="w-4 h-4 text-[#0F2942] group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Volver</span>
            </button>
          )}
        </div>

        {/* Centro: Título */}
        <div className="flex-1 flex justify-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0F2942] tracking-tight truncate text-center">
            {title}
          </h2>
        </div>

        {/* Lado Derecho: Inicio */}
        <div className="flex items-center justify-end w-1/4">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3 py-2 mr-[40px] bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[#0F2942] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm group cursor-pointer"
              title="Ir a Inicio"
            >
              <Home className="w-4 h-4 text-[#0F2942] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
          )}
        </div>
      </div>

      {/* Indicador por segmentos */}
      <div className="w-full flex gap-1 items-center px-1">
        {PAGES.map((id) => {
          const isActive = id === pageId;
          return (
            <div
              key={id}
              className={`h-[3px] rounded-full transition-all duration-300 ${
                isActive ? 'bg-[#38BDF8] flex-[2]' : 'bg-[#CBD5E1] flex-[1]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
