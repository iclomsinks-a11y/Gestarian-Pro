import React from 'react';
import { Eye } from 'lucide-react';

/**
 * Icono de Presupuesto (Ver Presupuesto): Dibujo del ojito
 */
export const SheetPIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <Eye className={className} strokeWidth={1.8} />
);

/**
 * Icono de Factura (Ver Factura): Dibujo del ojito
 */
export const SheetFIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <Eye className={className} strokeWidth={1.8} />
);

/**
 * Icono de Nuevo Presupuesto: Hoja con el signo '+' y la 'P' mayúscula dentro
 */
export const SheetPlusPIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Contorno de hoja con esquina superior derecha doblada */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    {/* Signo '+' a la izquierda */}
    <line x1="7" y1="13.5" x2="11" y2="13.5" strokeWidth="2" />
    <line x1="9" y1="11.5" x2="9" y2="15.5" strokeWidth="2" />
    {/* P mayúscula a la derecha */}
    <text 
      x="14.5" 
      y="16.5" 
      textAnchor="middle" 
      fontSize="8.5" 
      fontWeight="900" 
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
      fill="currentColor" 
      stroke="none"
    >
      P
    </text>
  </svg>
);

/**
 * Icono de Guardar: Disquete clásico de 3,5 pulgadas (sin recuadro, sin relleno, trazo vectorial de precisión)
 */
export const FloppyDisk35Icon: React.FC<{ className?: string }> = ({ className = "w-7 h-7 sm:w-9 sm:h-9" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Contorno del disquete 3.5" con esquina biselada superior derecha */}
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    {/* Corredera / obturador metálico superior de 3,5 pulgadas */}
    <path d="M7 3v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3" />
    {/* Ranura del obturador metálico */}
    <line x1="10" y1="5.5" x2="10" y2="7.5" strokeWidth="2" />
    {/* Etiqueta y muesca inferior */}
    <path d="M7 21v-7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7" />
  </svg>
);

