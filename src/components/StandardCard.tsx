import React, { useState } from 'react';
import { Eye, FolderOpen } from 'lucide-react';

export interface StandardCardProps {
  id?: string;
  status?: string | null;
  statusColor?: string;
  statusTextColor?: string;
  vehiclePlate?: string;
  subtitle?: string; // Línea 2: Marca, Modelo o subtítulo
  title: string;     // Línea 3: Nombre del cliente o entidad
  refCode?: string;  // Línea 4 izq: Número de documento, solicitud, etc.
  expediente?: string; // Línea 4 dcha: Expediente vinculado
  onClick?: () => void;
  isExpandable?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const StandardCard: React.FC<StandardCardProps> = ({
  id,
  status,
  statusColor,
  statusTextColor = 'text-orange-500',
  vehiclePlate,
  subtitle = 'Vehículo General',
  title,
  refCode,
  expediente,
  onClick,
  isExpandable = true,
  actions,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasStatus = status !== null && status !== undefined && status !== '';
  const finalStatus = hasStatus ? status : null;
  const finalBorder = statusColor || (hasStatus ? 'border-[3px] border-orange-500' : 'border border-[#CBD5E1]');

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
      className={`bg-white rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden ${finalBorder}`}
    >
      <div className="p-5 flex flex-col gap-4" onClick={handleClick}>
        {/* Línea 1: Estado (si existe) y Matrícula */}
        <div className="flex items-center justify-between">
          {finalStatus ? (
            <span className={`font-black text-sm tracking-widest ${statusTextColor}`}>
              {finalStatus}
            </span>
          ) : refCode ? (
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-sm">
              {refCode}
            </span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Ficha Cliente
            </span>
          )}

          {/* Matrícula Oficial (Estilo placa española) */}
          <div className="flex items-center ml-auto bg-white border-2 border-gray-400 rounded overflow-hidden h-8 min-w-[120px] shadow-xs">
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
        <div className="text-sm font-bold text-[#475569] uppercase tracking-wider">
          {subtitle || 'Vehículo Sin Especificar'}
        </div>

        {/* Línea 3: Nombre del Cliente */}
        <div className="text-xl font-black text-[#0F172A] truncate">
          {title || 'Cliente Desconocido'}
        </div>

        {/* Línea 4: Código de Referencia y Expediente con Iconos de acceso directo */}
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#64748B] font-mono pt-1 border-t border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            {refCode && (
              <span className="flex items-center gap-1.5 bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded-sm">
                {refCode}
              </span>
            )}
            {expediente && (
              <span className="flex items-center gap-1 text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm">
                {expediente}
              </span>
            )}
          </div>

          {/* Iconos de acceso directo: Ver Presupuesto y Ver Expediente (Roadmap) */}
          {(onViewDoc || onViewExpediente) && (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {onViewDoc && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDoc();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0F2942] border border-slate-300 rounded-md text-[11px] font-bold transition-all shadow-2xs cursor-pointer hover:border-slate-400"
                  title={viewDocLabel || 'Ver presupuesto'}
                  aria-label={viewDocLabel || 'Ver presupuesto'}
                >
                  <Eye className="w-3.5 h-3.5 text-[#0F2942]" />
                  <span>Ver</span>
                </button>
              )}
              {onViewExpediente && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewExpediente();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] border border-blue-300 rounded-md text-[11px] font-bold transition-all shadow-2xs cursor-pointer hover:border-blue-400"
                  title={viewExpedienteLabel || 'Ver expediente (Roadmap)'}
                  aria-label={viewExpedienteLabel || 'Ver expediente (Roadmap)'}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Expediente</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenido / Acciones desplegables */}
      {isExpandable && isExpanded && (actions || children) && (
        <div className="bg-gray-50 border-t border-gray-100 p-4" onClick={(e) => e.stopPropagation()}>
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};
