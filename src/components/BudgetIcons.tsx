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
 * Icono de Nueva Factura: Hoja con el signo '+' y la 'F' mayúscula dentro, sin relleno
 */
export const SheetPlusFIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Contorno de hoja con esquina superior derecha doblada sin relleno */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    {/* Signo '+' a la izquierda */}
    <line x1="7" y1="13.5" x2="11" y2="13.5" strokeWidth="2" />
    <line x1="9" y1="11.5" x2="9" y2="15.5" strokeWidth="2" />
    {/* F mayúscula a la derecha */}
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
      F
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

/**
 * Icono de Nuevo Proveedor: Camioncito con el signo '+' dentro de la caja, sin envoltorio y sin relleno
 */
export const TruckPlusIcon: React.FC<{ className?: string }> = ({ className = "w-9 h-9 sm:w-10 sm:h-10" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Contorno de carrocería y cabina del camión */}
    <path d="M14 18V6a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M14 8h4.5a1.5 1.5 0 0 1 1.2.6l2.3 3.1c.3.4.5.9.5 1.3V17a1 1 0 0 1-1 1h-2" />
    {/* Ruedas */}
    <circle cx="6.5" cy="18.5" r="2.5" />
    <circle cx="17.5" cy="18.5" r="2.5" />
    {/* Signo '+' dentro de la caja del camión */}
    <line x1="7.5" y1="8" x2="7.5" y2="14" strokeWidth="2" />
    <line x1="4.5" y1="11" x2="10.5" y2="11" strokeWidth="2" />
  </svg>
);

