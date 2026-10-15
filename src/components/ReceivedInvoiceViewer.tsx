import React, { useEffect, useRef, useState } from 'react';
import { GestarianDocument } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de pdfjs
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization:', e);
}

interface ReceivedInvoiceViewerProps {
  document: GestarianDocument;
}

export const ReceivedInvoiceViewer: React.FC<ReceivedInvoiceViewerProps> = ({ document: doc }) => {
  const [renderMode, setRenderMode] = useState<'image' | 'canvas' | 'html'>('html');
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rawBase64 = (doc as any).attachmentBase64;
  const mimeType = (doc as any).attachmentMimeType || '';

  const isImage = (
    mimeType.startsWith('image/') ||
    rawBase64?.startsWith('/9j/') ||
    rawBase64?.startsWith('iVBORw') ||
    rawBase64?.startsWith('R0lGOD') ||
    rawBase64?.startsWith('UklGR')
  );

  const isPdf = !isImage && (
    mimeType === 'application/pdf' ||
    rawBase64?.startsWith('JVBERi') ||
    Boolean(rawBase64)
  );

  useEffect(() => {
    let isMounted = true;

    const renderDoc = async () => {
      if (!rawBase64) {
        setRenderMode('html');
        setIsLoading(false);
        return;
      }

      if (isImage) {
        setRenderMode('image');
        setIsLoading(false);
        return;
      }

      if (isPdf) {
        try {
          const binaryString = atob(rawBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const loadingTask = pdfjsLib.getDocument({ data: bytes });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);

          if (!isMounted) return;

          const viewport = page.getViewport({ scale: 1.8 });
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await (page.render as any)({
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
              }).promise;
              if (isMounted) {
                setRenderMode('canvas');
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (err) {
          console.warn('Fallback a render HTML estructurado de factura:', err);
        }
      }

      if (isMounted) {
        setRenderMode('html');
        setIsLoading(false);
      }
    };

    renderDoc();

    return () => {
      isMounted = false;
    };
  }, [rawBase64, isImage, isPdf]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto bg-slate-950 p-2 sm:p-4">
      {/* 1. Modo Canvas (PDF renderizado directamente en Canvas, 0 permisos) */}
      <canvas
        ref={canvasRef}
        className={`max-h-full max-w-full object-contain rounded-lg shadow-2xl bg-white ${
          renderMode === 'canvas' ? 'block' : 'hidden'
        }`}
      />

      {/* 2. Modo Imagen (Fotografía / JPG / PNG renderizado directamente, 0 permisos) */}
      {renderMode === 'image' && rawBase64 && (
        <img
          src={`data:${mimeType || 'image/jpeg'};base64,${rawBase64}`}
          alt={`Factura ${doc.number}`}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl bg-white"
        />
      )}

      {/* 3. Modo Documento Estructurado Original (HTML/CSS de alta fidelidad, 0 permisos) */}
      {renderMode === 'html' && (
        <div className="w-full max-w-4xl max-h-full bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-2xl overflow-y-auto flex flex-col justify-between border border-slate-200">
          <div>
            {/* Cabecera Proveedor */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Proveedor / Emisor</span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">{doc.issuerName || 'Proveedor Facturación'}</h2>
                <p className="text-xs font-mono font-bold text-slate-600">CIF / NIF: {doc.issuerCif || '---'}</p>
                <p className="text-xs text-slate-600">{doc.issuerAddress || '---'}</p>
                {(doc.issuerPhone || doc.issuerEmail) && (
                  <p className="text-xs text-slate-500">{[doc.issuerPhone, doc.issuerEmail].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Factura Recibida</span>
                <p className="text-xl font-mono font-black text-slate-900 mt-1">{doc.number}</p>
                <p className="text-xs text-slate-600 font-medium">Fecha: {doc.date}</p>
              </div>
            </div>

            {/* Datos de Entrega / Cliente Receptor */}
            <div className="bg-slate-50 rounded-xl p-3.5 mb-6 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Receptor</span>
                <span className="font-bold text-slate-800">{doc.clientName || 'Nuestra Empresa'}</span>
                <span className="font-mono text-slate-500 block">CIF: {doc.clientCif || '---'}</span>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado Contable</span>
                <span className="font-black text-emerald-600 uppercase tracking-wider">Recibida / Registrada</span>
              </div>
            </div>

            {/* Tabla de Conceptos Desglosados */}
            <table className="w-full text-xs mb-6">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px]">
                  <th className="py-2.5 text-left font-bold">Concepto / Descripción</th>
                  <th className="py-2.5 text-center w-16 font-bold">Cant.</th>
                  <th className="py-2.5 text-right w-28 font-bold">Precio Unit.</th>
                  <th className="py-2.5 text-right w-28 font-bold">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(doc.items && doc.items.length > 0
                  ? doc.items
                  : [{ description: 'Gastos de compra / servicio según factura recibida', quantity: 1, unitPrice: doc.total, amount: doc.total }]
                ).map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-medium text-slate-800">{it.description}</td>
                    <td className="py-3 text-center text-slate-600 font-mono">{it.quantity}</td>
                    <td className="py-3 text-right font-mono text-slate-600">{(it.unitPrice || 0).toFixed(2)} €</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">{(it.amount || 0).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="border-t-2 border-slate-900 pt-4 flex flex-col items-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Imponible:</span>
                <span className="font-mono font-bold">{(doc.subtotal || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA ({doc.ivaRate || 21}%):</span>
                <span className="font-mono font-bold text-blue-700">{(doc.ivaAmount || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-200">
                <span className="uppercase tracking-wider">Total Factura:</span>
                <span className="font-mono text-emerald-700 text-lg">{(doc.total || 0).toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
