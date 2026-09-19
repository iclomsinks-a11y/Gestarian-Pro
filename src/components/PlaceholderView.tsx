import React from 'react';
import { PageHeader } from './PageHeader';

interface PlaceholderViewProps {
  id: string;
  title: string;
  logoUrl?: string;
  userFullName?: string;
  onBack?: () => void;
  onNavigateHome?: () => void;
  onOpenMenu?: () => void;
  children?: React.ReactNode;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  id,
  title,
  logoUrl,
  userFullName,
  onBack,
  onNavigateHome,
  onOpenMenu,
  children,
}) => (
  <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col p-4 sm:p-8 bg-[#F8F7F3] overflow-y-auto">
    <div className="max-w-7xl w-full mx-auto flex flex-col h-full">
      {/* Cabecera Superior: Logo arriba a la izquierda como botón a INICIO, botón Volver y Título */}
      <PageHeader
        pageId={id}
        title={title}
        onOpenMenu={onOpenMenu}
        onBack={onBack}
        onNavigateHome={onNavigateHome}
      />
      {/* Contenido de la página */}
      <div className="flex-1 flex flex-col">
        {children ? (
          children
        ) : (
          <div className="p-12 border-2 border-dashed border-[#CBD5E1] rounded-xl flex items-center justify-center text-[#64748B]">
            Módulo en construcción
          </div>
        )}
      </div>
    </div>
  </div>
);
