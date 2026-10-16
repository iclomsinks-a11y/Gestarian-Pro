import React, { useState } from 'react';
import { Eye, FolderOpen, ChevronDown, FolderKanban } from 'lucide-react';

export interface StandardCardProps {
  id?: string;
  status?: string | null;
  statusColor?: string;
  statusTextColor?: string;
  vehiclePlate?: string;
  subtitle?: string; // Línea 2: Marca, Modelo o subtítulo
  title: string;     // Línea 3: Nombre del cliente o entidad
  refCode?: string;  // Línea 4: Número de presupuesto / documento
  refCodeColor?: string;
  budgetNum?: string; // Línea 4: Número de presupuesto centrado
  budgetNumColor?: string;
  expediente?: string; // Línea 4: Expediente vinculado
  expedienteColor?: string;
  facturaNum?: string; // Línea 4: Factura vinculada
  facturaColor?: string;
  onClick?: () => void;
  isExpandable?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  onViewDoc?: () => void;
  onViewExpediente?: () => void;
  viewDocLabel?: string;
  viewExpedienteLabel?: string;
  extraHeaderAction?: React.ReactNode;
  cleanNumbersLayout?: boolean;
  cardBgColor?: string;
}

/**
 * Determina el color de fondo con un 5% de opacidad según el color del borde de la tarjeta
 */
export const getCardBgFromBorder = (borderClass: string, explicitBg?: string): string => {
  if (explicitBg && explicitBg !== 'bg-white' && explicitBg !== 'bg-gray-50' && !explicitBg.startsWith('bg-[#')) {
    return explicitBg;
  }
  const lower = borderClass.toLowerCase();
  if (lower.includes('emerald') || lower.includes('green')) return 'bg-emerald-500/5';
  if (lower.includes('rose') || lower.includes('red')) return 'bg-rose-500/5';
  if (lower.includes('blue') || lower.includes('sky')) return 'bg-blue-500/5';
  if (lower.includes('amber')) return 'bg-amber-500/5';
  if (lower.includes('orange')) return 'bg-orange-500/5';
  if (lower.includes('purple') || lower.includes('indigo')) return 'bg-purple-500/5';
  if (lower.includes('slate') || lower.includes('gray')) return 'bg-slate-500/5';
  return 'bg-emerald-500/5';
};

export const StandardCard: React.FC<StandardCardProps> = ({
  id,
  status,
  statusColor,
  statusTextColor = 'text-orange-500',
  vehiclePlate,
  subtitle = 'Vehículo General',
  title,
  refCode,
  refCodeColor,
  budgetNum,
  budgetNumColor,
  expediente,
  expedienteColor,
  facturaNum,
  facturaColor,
  onClick,
  isExpandable = true,
  actions,
  children,
  onViewDoc,
  onViewExpediente,
  viewDocLabel,
  viewExpedienteLabel,
  extraHeaderAction,
  cleanNumbersLayout = false,
  cardBgColor = 'bg-white',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasStatus = status !== null && status !== undefined && status !== '';
  const finalStatus = hasStatus ? status : null;
  const isAbonoParcial = Boolean(finalStatus && finalStatus.toLowerCase().trim() === 'abono parcial');
  const rawBorder = statusColor || (hasStatus ? 'border border-orange-500' : 'border border-[#CBD5E1]');
  // Asegurar que el ancho de la línea de borde sea de solamente 1 píxel (border)
  const finalBorder = rawBorder
    .replace(/border-\[\d+px\]/g, 'border')
    .replace(/\bborder-[2-8]\b/g, 'border');
  const effectiveBg = getCardBgFromBorder(finalBorder, cardBgColor);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (isExpandable) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      id={id}
      className={`${effectiveBg} rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden ${finalBorder} w-full lg:w-full mx-auto`}
    >
      <div className="pt-5 px-5 pb-2.5 flex flex-col gap-4" onClick={handleClick}>
        {/* Línea 1: Estado (si existe) y Matrícula */}
        <div className="flex items-center justify-between gap-2 w-full">
          {/* Espacio entre la línea de borde izquierda de la tarjeta y la matrícula */}
          <div className="flex-1 flex items-center justify-center min-w-0 pr-2">
            {isAbonoParcial ? (
              <div className={`h-8 flex flex-col justify-between py-0 text-left items-start font-black text-sm sm:text-base tracking-tight uppercase leading-none select-none ${statusTextColor}`}>
                <span className="leading-none text-left">ABONO</span>
                <span className="leading-none text-left">PARCIAL</span>
              </div>
            ) : finalStatus ? (
              <div className="w-full flex items-center justify-start">
                <span className={`font-black text-sm tracking-widest ${statusTextColor}`}>
                  {finalStatus}
                </span>
              </div>
            ) : refCode ? (
              <div className="w-full flex items-center justify-start">
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-sm">
                  {refCode}
                </span>
              </div>
            ) : (
              <div className="w-full flex items-center justify-start">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Ficha Cliente
                </span>
              </div>
            )}
            {extraHeaderAction && (
              <div onClick={(e) => e.stopPropagation()} className="ml-2">
                {extraHeaderAction}
              </div>
            )}
          </div>

          {/* Matrícula Oficial (Estilo placa española) a la derecha */}
          <div className="flex items-center bg-white border-2 border-gray-400 rounded overflow-hidden h-8 min-w-[120px] shadow-xs shrink-0 ml-auto">
            <div className="bg-blue-700 h-full w-6 flex flex-col items-center justify-center shrink-0">
              <span className="text-[6px] text-yellow-300 font-bold mb-0.5">⭐</span>
              <span className="text-[10px] text-white font-bold leading-none">E</span>
            </div>
            <div className="flex-1 flex items-center justify-center px-3 font-mono font-black text-lg tracking-widest text-[#0F172A]">
              {vehiclePlate || 'SIN-MAT'}
            </div>
          </div>
        </div>

        {/* Línea 2: Marca y Modelo / Subtítulo */}
        <div className="text-sm font-bold text-[#475569] uppercase tracking-wider leading-tight">
          {subtitle || 'Vehículo Sin Especificar'}
        </div>

        {/* Línea 3: Nombre del Titular (interlineado reducido a la mitad arriba y abajo) */}
        <div className="-mt-2 -mb-2 text-xl font-black text-[#0F172A] truncate leading-tight">
          {title || 'Cliente Desconocido'}
        </div>

        {/* Línea 4: Cuarta línea con números de Presupuesto, Factura y Expediente justificado a la derecha a tamaño x1.5 y con colores según estado */}
        <div className="w-full flex items-baseline justify-between gap-3 font-mono select-text pt-1 border-t border-slate-100/80 relative">
          <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
            {refCode && (
              <span
                title="Presupuesto / Documento / Solicitud"
                className={`text-xl sm:text-2xl md:text-[26px] font-black tracking-tight select-text ${refCodeColor || 'text-slate-800'}`}
              >
                {refCode}
              </span>
            )}

            {facturaNum && (
              <span
                title="Factura"
                className={`text-xl sm:text-2xl md:text-[26px] font-black tracking-tight select-text ${facturaColor || 'text-blue-900'}`}
              >
                {facturaNum}
              </span>
            )}
          </div>

          {budgetNum && (
            <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <span
                title="Presupuesto"
                className={`text-xl sm:text-2xl md:text-[26px] font-black tracking-tight select-text ${budgetNumColor || 'text-blue-900'}`}
              >
                {budgetNum}
              </span>
            </div>
          )}

          {expediente && (
            <span
              title="Expediente"
              className={`text-xl sm:text-2xl md:text-[26px] font-black tracking-tight select-text ml-auto text-right ${expedienteColor || 'text-slate-900'}`}
            >
              {expediente}
            </span>
          )}

          {isExpandable && (
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ml-auto shrink-0 ${
                isExpanded ? 'rotate-180 text-[#0F2942]' : ''
              }`}
            />
          )}
        </div>
      </div>

      {/* Contenido / Acciones desplegables al pulsar la tarjeta al crecer y desplazar el resto hacia abajo */}
      {isExpandable && isExpanded && (
        <div className="bg-[#FAF9F6] border-t border-[#E2E0D8] p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          {actions}
          {!actions && (onViewDoc || onViewExpediente) && (
            <div className="grid grid-cols-4 gap-3 items-center justify-items-center">
              {onViewDoc && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDoc();
                  }}
                  className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                  title={viewDocLabel || 'Ver documento'}
                  aria-label={viewDocLabel || 'Ver documento'}
                >
                  <Eye className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                </button>
              )}
              {onViewExpediente && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewExpediente();
                  }}
                  className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                  title={viewExpedienteLabel || 'Ver expediente (Roadmap)'}
                  aria-label={viewExpedienteLabel || 'Ver expediente'}
                >
                  <FolderKanban className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};
