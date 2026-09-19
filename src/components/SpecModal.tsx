import React, { useState } from 'react';
import { X, Copy, Download, Check, FileText } from 'lucide-react';
import { GESTARIAN_SPEC_TEXT } from '../data/gestarianSpec';
import { downloadFile } from '../services/exportService';

interface SpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecModal: React.FC<SpecModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(GESTARIAN_SPEC_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    downloadFile('GESTARIAN_SPEC.md', GESTARIAN_SPEC_TEXT, 'text/markdown;charset=utf-8;');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F172A]/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl my-6 bg-[#F8F7F3] border border-[#D5D2C9] rounded-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E0D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0F2942]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
              GESTARIAN_SPEC.md — Especificación y Arquitectura del Sistema
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8F7F3] text-[#0F2942] border border-[#0F2942] text-xs font-semibold uppercase rounded-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold uppercase rounded-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .md</span>
            </button>

            <button 
              onClick={onClose} 
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#64748B] hover:text-white hover:bg-rose-600 rounded-sm transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-[#FFFFFF] font-mono text-xs text-[#1E293B] leading-relaxed whitespace-pre-wrap select-text">
          {GESTARIAN_SPEC_TEXT}
        </div>

        {/* Footer con botón de salida */}
        <div className="px-6 py-3 bg-[#F1F0EB] border-t border-[#E2E0D8] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#0F172A] border border-[#CBD5E1] rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cerrar Especificación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
