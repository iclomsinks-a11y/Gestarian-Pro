import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, QrCode } from 'lucide-react';
import { GestarianDocument } from '../types';

interface VerifactuSectionProps {
  document: GestarianDocument;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VerifactuSection: React.FC<VerifactuSectionProps> = ({
  document: doc,
  size = 'md',
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Generar URL oficial de cotejo / verificación Verifactu de la AEAT
    const issuerCif = doc.issuerCif || 'B12345678';
    const numSerie = doc.number || 'FAC-001';
    const fecha = doc.date || new Date().toISOString().split('T')[0];
    const total = (doc.total || 0).toFixed(2);
    
    // Formato estándar de verificación Verifactu AEAT
    const verifactuPayload = `https://sede.agenciatributaria.gob.es/verifactu/consulta?nif=${encodeURIComponent(issuerCif)}&numserie=${encodeURIComponent(numSerie)}&fecha=${encodeURIComponent(fecha)}&importe=${encodeURIComponent(total)}`;

    QRCode.toDataURL(verifactuPayload, {
      width: size === 'lg' ? 160 : size === 'sm' ? 100 : 130,
      margin: 1,
      color: {
        dark: '#0F2942',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generando QR Verifactu:', err));
  }, [doc.issuerCif, doc.number, doc.date, doc.total, size]);

  const qrPx = size === 'lg' ? 'w-28 h-28 sm:w-32 sm:h-32' : size === 'sm' ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-24 h-24 sm:w-28 sm:h-28';

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 p-4 sm:p-5 bg-[#F8F7F3] border border-[#E2E0D8] rounded-xs ${className}`}>
      {/* Código QR Verifactu */}
      <div className="shrink-0 bg-white p-1.5 rounded-xs border border-[#CBD5E1] shadow-2xs flex items-center justify-center">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Verifactu ${doc.number}`}
            className={`${qrPx} object-contain`}
          />
        ) : (
          <div className={`${qrPx} bg-slate-100 flex items-center justify-center text-slate-400`}>
            <QrCode className="w-10 h-10 animate-pulse" />
          </div>
        )}
      </div>

      {/* Texto Oficial Verifactu (Multiplicado por 1.5) */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-[#0F2942]">
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
          <span className="text-base sm:text-lg font-black uppercase tracking-wider font-mono">
            VERI*FACTU
          </span>
          <span className="text-xs sm:text-sm font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-xs uppercase tracking-wide">
            Factura Verificable
          </span>
        </div>
        <p className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug">
          Factura verificable en la sede electrónica de la AEAT
        </p>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Documento expedido conforme a los requisitos del Reglamento Veri*factu (RD 1007/2023). Escanee el código QR para verificar la autenticidad e integridad del registro de facturación en la Agencia Tributaria.
        </p>
      </div>
    </div>
  );
};
