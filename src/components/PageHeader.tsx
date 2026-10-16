import React from 'react';
import { ArrowLeft, Home, Menu } from 'lucide-react';
import { GestarianPlan } from '../types';

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
  'page-equipo',
  'page-incidencias',
  'page-configuracion'
];

const AFFECTED_PAGES = [
  'page-expedientes',
  'page-solicitudes',
  'page-clientes',
  'page-presupuestos',
  'page-citas',
  'page-taller',
  'page-facturacion',
  'page-balances',
  'page-proveedores',
  'page-equipo',
  'page-incidencias'
];

interface PageHeaderProps {
  pageId?: string;
  title: string;
  onOpenMenu?: () => void;
  onBack?: () => void;
  onNavigateHome?: () => void;
  logoUrl?: string;
  userFullName?: string;
  currentPlan?: GestarianPlan;
  hideScrollIndicator?: boolean;
  hideMenu?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  pageId,
  title,
  onOpenMenu,
  onBack,
  onNavigateHome,
  currentPlan,
  hideScrollIndicator = false,
  hideMenu = false,
}) => {
  // Si pertenece a la serie de expedientes a incidencias, el header ya se renderiza dentro del footer de 30%
  if (pageId && AFFECTED_PAGES.includes(pageId)) {
    return null;
  }

  const isLite = currentPlan === 'lite';
  const shouldHideIndicator = hideScrollIndicator || isLite;
  const shouldHideMenu = hideMenu || isLite;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 shrink-0 flex flex-col gap-3 pt-[2px]">
      {/* Indicador por segmentos: a 2px fijos y consistentes de separación del techo del header */}
      {!shouldHideIndicator && (
        <div className="w-full flex gap-1.5 items-center px-0.5">
          {PAGES.filter((id) => {
            if (currentPlan === 'quick') {
              return (
                id === 'page-clientes' ||
                id === 'page-proveedores' ||
                id === 'page-balances' ||
                id === 'page-configuracion'
              );
            }
            return true;
          }).sort((a, b) => {
            if (currentPlan === 'quick') {
              const order = ['page-clientes', 'page-proveedores', 'page-balances', 'page-configuracion'];
              return order.indexOf(a) - order.indexOf(b);
            }
            return 0;
          }).map((id) => {
            const isActive = id === pageId;
            return (
              <div
                key={id}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  isActive ? 'bg-[#38BDF8] flex-[2]' : 'bg-[#CBD5E1]/60 flex-[1]'
                }`}
              />
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        
        {/* Lado Izquierdo: Inicio en Lite o Menú Vento y Volver en otros planes */}
        <div className="flex items-center gap-2 sm:gap-3 w-1/4">
          {isLite ? (
            onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[#0F2942] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm group cursor-pointer"
                title="Ir a Inicio"
              >
                <Home className="w-4 h-4 text-[#0F2942] group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Inicio</span>
              </button>
            )
          ) : (
            <>
              {onOpenMenu && !shouldHideMenu && (
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
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[#0F2942] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm group shrink-0"
                  title="Volver a la pantalla anterior"
                >
                  <ArrowLeft className="w-4 h-4 text-[#0F2942] group-hover:-translate-x-0.5 transition-transform" />
                  <span className="hidden sm:inline">Volver</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Centro: Título */}
        <div className="flex-1 flex justify-center">
          <h2 className={`${(pageId === 'page-proveedores' || title.toLowerCase().includes('proveedor')) ? 'text-[21.6px] sm:text-[25.6px] md:text-[28.8px]' : 'text-[27px] sm:text-[32px] md:text-[36px]'} font-black text-[#0F2942] tracking-tight truncate text-center`}>
            {title}
          </h2>
        </div>

        {/* Lado Derecho: Inicio (si no es Lite) */}
        <div className="flex items-center justify-end w-1/4">
          {!isLite && onNavigateHome && (
            <button
              type="button"
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
    </div>
  );
};
