import React, { useRef, useState } from 'react';
import { 
  ArrowLeft, Home, Menu, ClipboardList,
  SlidersHorizontal, Search, UserPlus, Calendar,
  BarChart3, Receipt, Users, Printer, Settings
} from 'lucide-react';
import { SheetPlusPIcon } from './BudgetIcons';
import { GestarianPlan } from '../types';

const AFFECTED_PAGES = [
  'page-expedientes',
  'page-roadmap',
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

const PAGES_NAV = [
  { id: 'page-expedientes', label: 'Expedientes' },
  { id: 'page-solicitudes', label: 'Solicitudes' },
  { id: 'page-clientes', label: 'Clientes' },
  { id: 'page-presupuestos', label: 'Presupuestos' },
  { id: 'page-citas', label: 'Citas' },
  { id: 'page-taller', label: 'Taller' },
  { id: 'page-facturacion', label: 'Facturas' },
  { id: 'page-balances', label: 'Balances' },
  { id: 'page-proveedores', label: 'Proveedores' },
  { id: 'page-equipo', label: 'Mi equipo' },
  { id: 'page-incidencias', label: 'Incidencias' },
  { id: 'page-configuracion', label: 'Configuración' },
];

const SINGLE_WORD_TITLES: Record<string, string> = {
  'page-expedientes': 'Expedientes',
  'page-roadmap': 'Expedientes',
  'page-solicitudes': 'Solicitudes',
  'page-clientes': 'Clientes',
  'page-presupuestos': 'Presupuestos',
  'page-citas': 'Citas',
  'page-taller': 'Taller',
  'page-facturacion': 'Facturas',
  'page-balances': 'Balances',
  'page-proveedores': 'Proveedores',
  'page-equipo': 'Equipo',
  'page-incidencias': 'Incidencias',
  'page-configuracion': 'Configuración',
};

interface PageLayoutWrapperProps {
  pageId: string;
  title: string;
  currentPlan?: GestarianPlan;
  onOpenMenu?: () => void;
  onBack?: () => void;
  onNavigateHome?: () => void;
  vehiclePlate?: string | null;
  onOpenDatos?: () => void;
  datosCount?: number;
  onNewClient?: () => void;
  onSearchClient?: () => void;
  onNewBudget?: () => void;
  onSearchBudget?: () => void;
  onOpenAgenda?: () => void;
  onSearchCitas?: () => void;
  onNewEmployee?: () => void;
  onSearchEmployee?: () => void;
  onNewInvoice?: () => void;
  footerExtraAction?: React.ReactNode;
  children: React.ReactNode;
}

export const PageLayoutWrapper: React.FC<PageLayoutWrapperProps> = ({
  pageId,
  title,
  currentPlan,
  onOpenMenu,
  onBack,
  onNavigateHome,
  vehiclePlate,
  onOpenDatos,
  datosCount,
  onNewClient,
  onSearchClient,
  onNewBudget,
  onSearchBudget,
  onOpenAgenda,
  onSearchCitas,
  onNewEmployee,
  onSearchEmployee,
  onNewInvoice,
  footerExtraAction,
  children,
}) => {
  const isSplitLayout = AFFECTED_PAGES.includes(pageId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Estado de modo filtro para Expedientes
  const [isExpedienteFilterMode, setIsExpedienteFilterMode] = useState(false);
  const [activeExpedienteFilter, setActiveExpedienteFilter] = useState<'todos' | 'en_curso' | 'cerrados'>('todos');

  // Estado de modo filtro para Solicitudes
  const [isSolicitudFilterMode, setIsSolicitudFilterMode] = useState(false);
  const [activeSolicitudFilter, setActiveSolicitudFilter] = useState<'todas' | 'pendiente' | 'atendida' | 'cerrada' | 'aceptada' | 'confirmada'>('todas');

  // Estado de buscador de presupuestos en el footer
  const [isBudgetSearchOpen, setIsBudgetSearchOpen] = useState(false);
  const [budgetSearchQuery, setBudgetSearchQuery] = useState('');

  // Estado de buscador de citas en el footer
  const [isCitasSearchOpen, setIsCitasSearchOpen] = useState(false);
  const [citasSearchQuery, setCitasSearchQuery] = useState('');

  // Estados para Balances: Horquilla temporal y Modo de vista (Gráfico vs Líneas de importe)
  const [balanceTimeframe, setBalanceTimeframe] = useState<'mensual' | 'trimestral' | 'anual'>('mensual');
  const [balanceViewMode, setBalanceViewMode] = useState<'grafico' | 'lineas'>('grafico');

  // Si no pertenece a la serie de expedientes a incidencias, renderizar maquetación estándar
  if (!isSplitLayout) {
    return <>{children}</>;
  }

  // Título con UNA SOLA PALABRA
  const singleWordTitle = SINGLE_WORD_TITLES[pageId] || (
    (pageId === 'page-facturacion' || title.toLowerCase().includes('factura'))
      ? 'Facturas'
      : title.trim().split(' ')[0]
  );

  return (
    <div id={pageId} className="w-screen h-screen shrink-0 snap-start overflow-hidden flex flex-col bg-white select-none">
      {/* 1. HEADER SUPERIOR FIJO: CENTRADO SOBRE EL FONDO GRIS IGUAL QUE EL FOOTER (#f2f2f2) - ALTURA x0.7 */}
      <header className="w-full bg-[#f2f2f2] text-slate-800 border-b border-slate-300 py-1 sm:py-1.5 px-4 shrink-0 flex flex-col items-center justify-center relative select-none z-20">
        <div className="w-full flex items-center justify-between min-w-0 relative">
          {currentPlan === 'lite' && onNavigateHome ? (
            <div className="w-1/4 flex items-center justify-start">
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs group cursor-pointer shrink-0"
                title="Ir a Inicio"
              >
                <Home className="w-4 h-4 text-slate-800 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Inicio</span>
              </button>
            </div>
          ) : (
            <div className="w-1/4" />
          )}

          <h2 className={`${(pageId === 'page-proveedores' || singleWordTitle.toLowerCase() === 'proveedores') ? 'text-[21.6px] sm:text-[25.6px] md:text-[28.8px]' : 'text-[27px] sm:text-[32px] md:text-[36px]'} font-black tracking-tight text-slate-900 uppercase text-center truncate leading-none flex-1`}>
            {singleWordTitle}
          </h2>

          <div className="w-1/4" />
        </div>

        {vehiclePlate && (
          <div className="mt-1 flex items-center justify-center min-w-0 px-2">
            <div className="flex items-center bg-white border-2 border-slate-500 rounded-md overflow-hidden h-8 sm:h-9 min-w-[140px] sm:min-w-[160px] shadow-sm shrink-0">
              <div className="bg-blue-700 h-full w-6 sm:w-7 flex flex-col items-center justify-center shrink-0">
                <span className="text-[6px] sm:text-[8px] text-yellow-300 font-bold mb-0.5 leading-none">⭐</span>
                <span className="text-[10px] sm:text-xs text-white font-black leading-none">E</span>
              </div>
              <div className="flex-1 flex items-center justify-center px-2 font-mono font-black text-base sm:text-lg tracking-wider text-[#0F172A] leading-none">
                {vehiclePlate}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. ÁREA DE CONTENIDO: A TODO EL ANCHO, COLOR BLANCO PURO (bg-white) CON 10PX DE AIRE EN MÓVIL Y TABLET */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-auto px-[10px] sm:px-[10px] lg:px-8 pt-[10px] pb-2 scroll-smooth focus:outline-none focus:ring-0 bg-white"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="w-full pb-8 [&>div]:w-full [&>div]:max-w-none [&>div]:bg-transparent [&>div]:h-auto [&>div]:min-h-0 [&>div]:overflow-visible [&_.max-w-7xl]:max-w-none [&_.max-w-7xl]:w-full [&_.max-w-7xl]:px-0 [&_.max-w-7xl]:sm:px-0 [&_.max-w-7xl]:lg:px-8">
          {children}
        </div>
      </div>

      {/* 3. FOOTER INFERIOR (Oculto solo en Lite cuando se muestra la hoja directa) */}
      {((pageId !== 'page-facturacion' && pageId !== 'page-presupuestos') || currentPlan !== 'lite') && (
        <footer className="w-full h-auto shrink-0 bg-[#f2f2f2] text-slate-800 border-t border-slate-300 flex flex-col justify-center px-4 sm:px-8 pt-[5px] pb-2.5 sm:pb-3 relative select-none">
        
        {isExpedienteFilterMode && pageId === 'page-expedientes' && !vehiclePlate ? (
          /* CUATRO BOTONES QUE OCUPAN EL FOOTER EN EXPEDIENTES: 2 EN UNA LÍNEA Y 2 DEBAJO EN OTRA LÍNEA */
          <div className="w-full grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 py-1 pb-1.5">
            {/* LÍNEA 1: TODOS y EN CURSO */}
            <button
              type="button"
              onClick={() => {
                setActiveExpedienteFilter('todos');
                window.dispatchEvent(new CustomEvent('gestarian_filter_expedientes', { detail: { filter: 'todos' } }));
              }}
              className={`w-full py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center ${
                activeExpedienteFilter === 'todos'
                  ? 'bg-sky-500 text-white shadow-md ring-2 ring-sky-300'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveExpedienteFilter('en_curso');
                window.dispatchEvent(new CustomEvent('gestarian_filter_expedientes', { detail: { filter: 'en_curso' } }));
              }}
              className={`w-full py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center ${
                activeExpedienteFilter === 'en_curso'
                  ? 'bg-sky-500 text-white shadow-md ring-2 ring-sky-300'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              En curso
            </button>

            {/* LÍNEA 2: CERRADOS y VOLVER */}
            <button
              type="button"
              onClick={() => {
                setActiveExpedienteFilter('cerrados');
                window.dispatchEvent(new CustomEvent('gestarian_filter_expedientes', { detail: { filter: 'cerrados' } }));
              }}
              className={`w-full py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center ${
                activeExpedienteFilter === 'cerrados'
                  ? 'bg-sky-500 text-white shadow-md ring-2 ring-sky-300'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              Cerrados
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveExpedienteFilter('todos');
                window.dispatchEvent(new CustomEvent('gestarian_filter_expedientes', { detail: { filter: 'todos' } }));
                setIsExpedienteFilterMode(false);
              }}
              className="w-full py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-[0.98] bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400" />
              <span>Volver</span>
            </button>
          </div>
        ) : isSolicitudFilterMode && pageId === 'page-solicitudes' ? (
          /* CUATRO BOTONES QUE OCUPAN EL FOOTER EN SOLICITUDES: PENDIENTE, ATENDIDA, CERRADA, VOLVER */
          <div className="w-full grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 py-1 pb-1.5">
            {/* LÍNEA 1: PENDIENTE y ATENDIDA */}
            <button
              type="button"
              onClick={() => {
                setActiveSolicitudFilter('pendiente');
                window.dispatchEvent(new CustomEvent('gestarian_filter_solicitudes', { detail: { filter: 'pendiente' } }));
              }}
              className={`w-full py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center ${
                activeSolicitudFilter === 'pendiente'
                  ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              Pendiente
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSolicitudFilter('atendida');
                window.dispatchEvent(new CustomEvent('gestarian_filter_solicitudes', { detail: { filter: 'atendida' } }));
              }}
              className={`w-full py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center ${
                activeSolicitudFilter === 'atendida'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              Atendida
            </button>

            {/* LÍNEA 2: CERRADA y VOLVER */}
            <button
              type="button"
              onClick={() => {
                setActiveSolicitudFilter('cerrada');
                window.dispatchEvent(new CustomEvent('gestarian_filter_solicitudes', { detail: { filter: 'cerrada' } }));
              }}
              className={`w-full py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center ${
                activeSolicitudFilter === 'cerrada'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              Cerrada
            </button>

            <button
              type="button"
              onClick={() => {
                // Siempre que pulsemos volver, se cargan todas
                setActiveSolicitudFilter('todas');
                window.dispatchEvent(new CustomEvent('gestarian_filter_solicitudes', { detail: { filter: 'todas' } }));
                setIsSolicitudFilterMode(false);
              }}
              className="w-full py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-[0.98] bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400" />
              <span>Volver</span>
            </button>
          </div>
        ) : (
          /* VISTA ESTÁNDAR DEL FOOTER CON ICONOS DIRECTOS */
          <div className="w-full flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2 sm:gap-3">
                {onOpenMenu && (
                  <button
                    id="btn-footer-menu"
                    type="button"
                    onClick={onOpenMenu}
                    className="inline-flex items-center justify-center p-2 sm:p-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                    title="Abrir Menú Principal"
                  >
                    <Menu className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800 shrink-0" />
                  </button>
                )}

                {onBack && (
                  <button
                    id="btn-footer-back"
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center justify-center p-2 sm:p-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                    title="Volver"
                  >
                    <ArrowLeft className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800 hover:text-sky-600 transition-colors shrink-0" />
                  </button>
                )}
              </div>

              {/* Lado derecho de la botonera: iconos x1.5 */}
              <div className="flex items-center gap-4 sm:gap-5">
                
                {/* En Expedientes: Icono para filtrar (x1.5) */}
                {pageId === 'page-expedientes' && !vehiclePlate && (
                  <button
                    id="btn-footer-filter-expedientes"
                    type="button"
                    onClick={() => setIsExpedienteFilterMode(true)}
                    className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center relative"
                    title="Filtrar Expedientes"
                  >
                    <SlidersHorizontal className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                    {activeExpedienteFilter !== 'todos' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full shadow-xs ring-2 ring-white" />
                    )}
                  </button>
                )}

                {/* En Solicitudes: Icono para filtrar (x1.5) */}
                {pageId === 'page-solicitudes' && (
                  <button
                    id="btn-footer-filter-solicitudes"
                    type="button"
                    onClick={() => setIsSolicitudFilterMode(true)}
                    className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center relative"
                    title="Filtrar Solicitudes"
                  >
                    <SlidersHorizontal className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                    {activeSolicitudFilter !== 'todas' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full shadow-xs ring-2 ring-white" />
                    )}
                  </button>
                )}

                {/* En Presupuestos: Icono de lupa para buscar e input desplegable, e icono flotante de hoja A4 con +P para nuevo presupuesto (x1.5) */}
                {pageId === 'page-presupuestos' && (
                  <>
                    {isBudgetSearchOpen && (
                      <div className="flex items-center gap-1.5 bg-white border-2 border-slate-400 rounded-xl px-2.5 py-1 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <input
                          id="input-budget-search"
                          type="text"
                          value={budgetSearchQuery}
                          onChange={(e) => {
                            setBudgetSearchQuery(e.target.value);
                            window.dispatchEvent(new CustomEvent('gestarian_budget_search', { detail: { query: e.target.value } }));
                          }}
                          placeholder="Buscar presupuesto..."
                          className="text-xs sm:text-sm font-bold text-slate-800 outline-none w-36 sm:w-56 bg-transparent placeholder:text-slate-400"
                        />
                        {budgetSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setBudgetSearchQuery('');
                              window.dispatchEvent(new CustomEvent('gestarian_budget_search', { detail: { query: '' } }));
                            }}
                            className="text-slate-400 hover:text-slate-700 text-xs font-black p-0.5"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      id="btn-footer-search-presupuesto"
                      type="button"
                      onClick={() => {
                        if (onSearchBudget) onSearchBudget();
                        setIsBudgetSearchOpen(!isBudgetSearchOpen);
                      }}
                      className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center relative"
                      title="Buscar Presupuesto"
                    >
                      <Search className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                      {budgetSearchQuery.trim() !== '' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full shadow-xs ring-2 ring-white" />
                      )}
                    </button>

                    <button
                      id="btn-footer-new-presupuesto"
                      type="button"
                      onClick={() => {
                        if (onNewBudget) onNewBudget();
                        window.dispatchEvent(new CustomEvent('gestarian_new_budget'));
                      }}
                      className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center"
                      title="Nuevo Presupuesto"
                    >
                      <SheetPlusPIcon className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.8]" />
                    </button>
                  </>
                )}

                {/* En Clientes: Icono de lupa e icono de añadir cliente (x1.5) sin recuadro ni relleno */}
                {pageId === 'page-clientes' && (
                  <>
                    <button
                      id="btn-footer-search-cliente"
                      type="button"
                      onClick={() => {
                        if (onSearchClient) onSearchClient();
                        window.dispatchEvent(new CustomEvent('gestarian_toggle_client_search'));
                      }}
                      className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center"
                      title="Buscar Cliente"
                    >
                      <Search className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                    </button>

                    <button
                      id="btn-footer-new-cliente"
                      type="button"
                      onClick={() => {
                        if (onNewClient) onNewClient();
                        window.dispatchEvent(new CustomEvent('gestarian_new_client'));
                      }}
                      className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center"
                      title="Añadir Nuevo Cliente"
                    >
                      <UserPlus className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                    </button>
                  </>
                )}

                {/* En Citas: Icono de lupa para buscar e icono de agenda flotante (x1.5) sin recuadro ni relleno */}
                {pageId === 'page-citas' && (
                  <>
                    {isCitasSearchOpen && (
                      <div className="flex items-center gap-1.5 bg-white border-2 border-slate-400 rounded-xl px-2.5 py-1 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <input
                          id="input-citas-search"
                          type="text"
                          value={citasSearchQuery}
                          onChange={(e) => {
                            setCitasSearchQuery(e.target.value);
                            window.dispatchEvent(new CustomEvent('gestarian_citas_search', { detail: { query: e.target.value } }));
                          }}
                          placeholder="Buscar cita..."
                          className="text-xs sm:text-sm font-bold text-slate-800 outline-none w-36 sm:w-56 bg-transparent placeholder:text-slate-400"
                        />
                        {citasSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setCitasSearchQuery('');
                              window.dispatchEvent(new CustomEvent('gestarian_citas_search', { detail: { query: '' } }));
                            }}
                            className="text-slate-400 hover:text-slate-700 text-xs font-black p-0.5 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      id="btn-footer-search-citas"
                      type="button"
                      onClick={() => {
                        if (onSearchCitas) onSearchCitas();
                        setIsCitasSearchOpen(!isCitasSearchOpen);
                      }}
                      className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center relative"
                      title="Buscar Cita"
                    >
                      <Search className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                      {citasSearchQuery.trim() !== '' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full shadow-xs ring-2 ring-white" />
                      )}
                    </button>

                    <button
                      id="btn-footer-agenda"
                      type="button"
                      onClick={() => {
                        if (onOpenAgenda) onOpenAgenda();
                        window.dispatchEvent(new CustomEvent('gestarian_open_agenda'));
                      }}
                      className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center"
                      title="Abrir Agenda"
                    >
                      <Calendar className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                    </button>
                  </>
                )}

                {/* En Facturas (page-facturacion): Icono de nueva factura A4 */}
                {pageId === 'page-facturacion' && (
                  <button
                    id="btn-footer-new-factura"
                    type="button"
                    onClick={() => {
                      if (onNewInvoice) onNewInvoice();
                      window.dispatchEvent(new CustomEvent('gestarian_new_invoice'));
                    }}
                    className="p-1.5 text-slate-700 hover:text-emerald-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center"
                    title="Nueva Factura (Abrir Hoja A4)"
                  >
                    <Receipt className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                  </button>
                )}

                {/* En Mi Equipo (page-equipo): Icono de lupa e icono de añadir empleado (+muñequito) */}
                {pageId === 'page-equipo' && (
                  <>
                    <button
                      id="btn-footer-search-equipo"
                      type="button"
                      onClick={() => {
                        if (onSearchEmployee) onSearchEmployee();
                        window.dispatchEvent(new CustomEvent('gestarian_toggle_employee_search'));
                      }}
                      className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center"
                      title="Buscar Empleado"
                    >
                      <Search className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                    </button>

                    <button
                      id="btn-footer-new-equipo"
                      type="button"
                      onClick={() => {
                        if (onNewEmployee) onNewEmployee();
                        window.dispatchEvent(new CustomEvent('gestarian_new_employee'));
                      }}
                      className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center"
                      title="Añadir Nuevo Empleado"
                    >
                      <UserPlus className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                    </button>
                  </>
                )}

                {/* En Balances: Botones de filtrado de horquilla temporal y botón para alternar entre gráficos y líneas de importe */}
                {pageId === 'page-balances' && (
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Selector de horquilla temporal: Mensual / Trimestral / Anual */}
                    <div className="inline-flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setBalanceTimeframe('mensual');
                          window.dispatchEvent(new CustomEvent('gestarian_balance_timeframe', { detail: { timeframe: 'mensual' } }));
                        }}
                        className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          balanceTimeframe === 'mensual'
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Mes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBalanceTimeframe('trimestral');
                          window.dispatchEvent(new CustomEvent('gestarian_balance_timeframe', { detail: { timeframe: 'trimestral' } }));
                        }}
                        className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          balanceTimeframe === 'trimestral'
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Trimestre
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBalanceTimeframe('anual');
                          window.dispatchEvent(new CustomEvent('gestarian_balance_timeframe', { detail: { timeframe: 'anual' } }));
                        }}
                        className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          balanceTimeframe === 'anual'
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Año
                      </button>
                    </div>

                    {/* Botón flotante para alternar entre Gráficos y Líneas de Importe (x1.5) */}
                    <button
                      id="btn-footer-toggle-balance-view"
                      type="button"
                      onClick={() => {
                        const nextMode = balanceViewMode === 'grafico' ? 'lineas' : 'grafico';
                        setBalanceViewMode(nextMode);
                        window.dispatchEvent(new CustomEvent('gestarian_balance_view_mode', { detail: { mode: nextMode } }));
                      }}
                      className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center relative"
                      title={balanceViewMode === 'grafico' ? 'Ver Líneas de Importe' : 'Ver Gráfico'}
                    >
                      {balanceViewMode === 'grafico' ? (
                        <Receipt className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.8]" />
                      ) : (
                        <BarChart3 className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.8]" />
                      )}
                    </button>
                  </div>
                )}

                {/* Botón de datos en forma de icono flotante sin envoltorio (x1.5) */}
                {onOpenDatos && (
                  <button
                    id="btn-footer-datos"
                    type="button"
                    onClick={onOpenDatos}
                    className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center relative"
                    title="Datos del Expediente"
                  >
                    <ClipboardList className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                    {datosCount !== undefined && datosCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                        {datosCount}
                      </span>
                    )}
                  </button>
                )}

                {footerExtraAction}


                {/* Botón de Configuración en el footer para la versión Quick y Lite (Oculto en Proveedores de Quick) */}
                {(currentPlan === 'quick' || currentPlan === 'lite') && (pageId !== 'page-proveedores') && (
                  <button
                    id="btn-footer-configuracion"
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('gestarian_navigate_section', { detail: { sectionId: 'page-configuracion' } }));
                    }}
                    className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center"
                    title="Configuración de usuario y datos fiscales"
                  >
                    <Settings className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                  </button>
                )}

                {/* Botón de Inicio en forma de dibujo de casita flotante (x1.5) */}
                {onNavigateHome && (
                  <button
                    id="btn-footer-home"
                    type="button"
                    onClick={onNavigateHome}
                    className="p-1.5 text-slate-700 hover:text-sky-600 transition-all hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center"
                    title="Ir a Inicio"
                  >
                    <Home className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
                  </button>
                )}
              </div>
            </div>
        )}

        {/* LÍNEA INDICATIVA DE POSICIÓN DE PÁGINA (SCROLL LATERAL) ABAJO DEL FOOTER A 3PX DEL BORDE INFERIOR OCUPANDO TODO EL ANCHO DEL FOOTER */}
        <div className="absolute bottom-[3px] left-0 right-0 w-full flex gap-1 items-center px-4 z-50">
          {PAGES_NAV
            .filter((p) => {
              if (currentPlan === 'lite') {
                return p.id === 'page-presupuestos' || p.id === 'page-facturacion' || p.id === 'page-configuracion';
              }
              if (currentPlan === 'quick') {
                return (
                  p.id === 'page-facturacion' ||
                  p.id === 'page-clientes' ||
                  p.id === 'page-proveedores' ||
                  p.id === 'page-balances' ||
                  p.id === 'page-configuracion'
                );
              }
              return true;
            })
            .sort((a, b) => {
              if (currentPlan === 'quick') {
                const order = ['page-facturacion', 'page-clientes', 'page-proveedores', 'page-balances', 'page-configuracion'];
                return order.indexOf(a.id) - order.indexOf(b.id);
              }
              return 0;
            })
            .map((p) => {
              const isActive = p.id === pageId;
              return (
                <div
                  key={p.id}
                  title={p.label}
                  className={`h-[3px] sm:h-[4px] rounded-full transition-all duration-300 ${
                    isActive ? 'bg-sky-500 flex-[2.5] shadow-[0_0_8px_#38BDF8]' : 'bg-slate-300 flex-[1]'
                  }`}
                />
              );
            })}
        </div>

      </footer>
      )}
    </div>
  );
};
