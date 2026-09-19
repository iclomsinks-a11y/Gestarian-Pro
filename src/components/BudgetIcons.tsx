import React from 'react';

/**
 * Icono de Presupuesto: Hoja con una 'P' mayúscula dentro
 */
export const SheetPIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
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
    {/* P mayúscula centrada */}
    <text 
      x="12" 
      y="16.5" 
      textAnchor="middle" 
      fontSize="9.5" 
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
