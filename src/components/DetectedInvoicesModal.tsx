import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  CheckCircle2,
  XCircle,
  Trash2,
  Euro,
  Calendar,
  Building2,
  Eye,
  ArrowLeft,
  Mail,
  Download,
  ExternalLink,
  Layers,
  FileCode
} from 'lucide-react';
import { GestarianDocument } from '../types';

interface DetectedInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedInvoices: GestarianDocument[];
  onIncorporateInvoice: (doc: GestarianDocument) => void;
  onRejectInvoice: (docId: string) => void;
  onDeleteInvoice: (docId: string) => void;
  userLogoUrl?: string;
  onShowToast?: (msg: string) => void;
}

export const DetectedInvoicesModal: React.FC<DetectedInvoicesModalProps> = ({
  isOpen,
  onClose,
  detectedInvoices,
  onIncorporateInvoice,
  onRejectInvoice,
  onDeleteInvoice,
  onShowToast
}) => {
  const [selectedDoc, setSelectedDoc] = useState<GestarianDocument | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'rejected'>('all');

  if (!isOpen) return null;

  const pendingInvoices = detectedInvoices.filter(d => d.status !== 'rechazada');
  const rejectedInvoices = detectedInvoices.filter(d => d.status === 'rechazada');

  const filteredInvoices = filter === 'pending'
    ? pendingInvoices
    : filter === 'rejected'
    ? rejectedInvoices
    : detectedInvoices;

  const handleIncorporate = (doc: GestarianDocument) => {
    onIncorporateInvoice(doc);
    setSelectedDoc(null);
    onShowToast?.(`Factura ${doc.number} incorporada con éxito a Facturas Recibidas`);
  };

  const handleReject = (docId: string) => {
    onRejectInvoice(docId);
    setSelectedDoc(null);
    onShowToast?.('Factura rechazada. Ahora puede eliminarla si lo desea');
  };

  const handleDelete = (docId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDeleteInvoice(docId);
    if (selectedDoc?.id === docId) setSelectedDoc(null);
    onShowToast?.('Factura eliminada del listado de rastreo');
  };

  const rawBase64 = selectedDoc ? (selectedDoc as any).attachmentBase64 : null;
  const mimeType = selectedDoc ? ((selectedDoc as any).attachmentMimeType || 'application/pdf') : 'application/pdf';
  const filename = selectedDoc ? ((selectedDoc as any).attachmentFilename || `Factura_${selectedDoc.number}.pdf`) : 'Factura.pdf';

  const handleDownloadOriginalPdf = (doc: GestarianDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const b64 = (doc as any).attachmentBase64;
    const mType = (doc as any).attachmentMimeType || 'application/pdf';
    const fName = (doc as any).attachmentFilename || `Factura_${doc.number}.pdf`;
    
    if (b64) {
      const link = document.createElement('a');
      link.href = `data:${mType};base64,${b64}`;
      link.download = fName;
      link.click();
      onShowToast?.(`Descargando ${fName}`);
    } else {
      onShowToast?.('Archivo PDF original no disponible para descarga directa');
    }
  };

  const handleOpenPdfPopup = (doc: GestarianDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const b64 = (doc as any).attachmentBase64;
    const mType = (doc as any).attachmentMimeType || 'application/pdf';
    
    if (b64) {
      try {
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        return;
      } catch (err) {
        console.warn('No se pudo abrir blob, abriendo dataUrl:', err);
        window.open(`data:${mType};base64,${b64}`, '_blank');
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md select-none"
      >
        {/* Contenedor Principal (70% de altura de la pantalla del dispositivo) */}
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          className="relative w-full max-w-5xl h-[70vh] max-h-[70vh] flex flex-col rounded-3xl bg-[#0F172A] border border-white/15 shadow-2xl text-white overflow-hidden z-10"
        >
          {/* VISTA 1: LISTADO DE TARJETAS DE FACTURAS DETECTADAS CON CONCEPTOS EXTRAÍDOS */}
          {!selectedDoc ? (
            <div className="flex flex-col h-full">
              {/* Cabecera del Listado */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/90 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                      Facturas Detectadas por Rastreo
                    </h2>
                    <p className="text-xs text-slate-400">
                      Formatos originales de proveedores con conceptos extraídos para revisión e incorporación
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filtros rápidos y Contadores */}
              <div className="flex items-center justify-between px-6 py-3 bg-slate-900/40 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filter === 'all'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    Todas ({detectedInvoices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('pending')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filter === 'pending'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    Pendientes ({pendingInvoices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('rejected')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filter === 'rejected'
                        ? 'bg-rose-500 text-white shadow-md font-black'
                        : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    Rechazadas ({rejectedInvoices.length})
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-medium hidden sm:block">
                  Pulse en una tarjeta para abrir el visor del documento original PDF
                </div>
              </div>

              {/* Lista de Tarjetas con Scroll */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {filteredInvoices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredInvoices.map((doc) => {
                      const isRejected = doc.status === 'rechazada';
                      const hasDocPdf = Boolean((doc as any).attachmentBase64);

                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className={`relative flex flex-col p-5 rounded-2xl transition-all cursor-pointer group select-none border-2 ${
                            isRejected
                              ? 'bg-rose-950/25 border-rose-500/40 hover:border-rose-500 hover:bg-rose-950/40'
                              : 'bg-slate-800/90 border-slate-700/80 hover:border-emerald-400 hover:bg-slate-800 hover:shadow-xl hover:shadow-emerald-500/10'
                          }`}
                        >
                          {/* Cabecera Tarjeta: Proveedor y Estado */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isRejected ? 'bg-rose-900/60 text-rose-300 border border-rose-500/30' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div className="overflow-hidden">
                                <h3 className="font-bold text-sm sm:text-base text-white truncate group-hover:text-emerald-300 transition-colors">
                                  {doc.issuerName || 'Proveedor Emisor'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                  CIF: {doc.issuerCif || 'No especificado'}
                                </p>
                              </div>
                            </div>

                            {/* Badge de Estado */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                              isRejected
                                ? 'bg-rose-900/80 text-rose-200 border-rose-500/40'
                                : 'bg-emerald-900/80 text-emerald-300 border-emerald-500/40'
                            }`}>
                              {isRejected ? 'Rechazada' : 'Detectada'}
                            </span>
                          </div>

                          {/* Datos principales de la Factura */}
                          <div className="grid grid-cols-2 gap-3 py-2.5 border-y border-white/5 my-1 bg-slate-900/40 px-3 rounded-xl">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                                Nº Factura
                              </span>
                              <span className="text-sm font-mono font-black text-white">
                                {doc.number}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                                Importe Total
                              </span>
                              <span className="text-base sm:text-lg font-mono font-black text-emerald-400">
                                {doc.total.toFixed(2)} €
                              </span>
                            </div>
                          </div>

                          {/* CONCEPTOS EXTRAÍDOS DE LA FACTURA */}
                          <div className="mt-3 mb-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1">
                                <Layers className="w-3 h-3 text-emerald-400" />
                                Conceptos Extraídos ({doc.items?.length || 0}):
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Base: {doc.subtotal.toFixed(2)} € + IVA: {doc.ivaAmount.toFixed(2)} €
                              </span>
                            </div>

                            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                              {doc.items && doc.items.length > 0 ? (
                                doc.items.map((item, idx) => (
                                  <div
                                    key={item.id || idx}
                                    className="flex items-center justify-between text-xs bg-slate-900/60 p-1.5 rounded-lg border border-white/5"
                                  >
                                    <span className="text-slate-300 truncate max-w-[210px] font-medium" title={item.description}>
                                      • {item.description}
                                    </span>
                                    <span className="font-mono font-bold text-emerald-300 text-[11px] shrink-0">
                                      {item.amount > 0 ? `${item.amount.toFixed(2)} €` : (item.unitPrice > 0 ? `${item.unitPrice.toFixed(2)} €` : '')}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[11px] text-slate-500 italic p-1">
                                  Concepto general de factura
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Fecha y Archivo Original */}
                          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-white/5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {doc.date}
                            </span>
                            <span className="text-[11px] text-slate-400 italic truncate max-w-[180px]">
                              {(doc as any).attachmentFilename || 'PDF Original Proveedor'}
                            </span>
                          </div>

                          {/* Botonera de la tarjeta */}
                          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDoc(doc);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Ver Factura PDF</span>
                              </button>

                              {hasDocPdf && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDownloadOriginalPdf(doc, e)}
                                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                  title="Descargar PDF Original"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Botón Eliminar si está rechazada */}
                              {isRejected ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(doc.id, e)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-900/70 hover:bg-rose-800 text-rose-200 border border-rose-500/40 text-xs font-bold transition-colors cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                                  title="Eliminar permanentemente de las facturas detectadas"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(doc.id);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-700/80 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                    title="Rechazar y no incorporar"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Rechazar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleIncorporate(doc);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Incorporar</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      No hay facturas en esta categoría
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Las facturas que se detecten automáticamente en tu correo o mediante el botón de rastreo aparecerán listadas aquí con sus conceptos extraídos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VISTA 2: VISOR DEL DOCUMENTO ORIGINAL PDF DEL PROVEEDOR CON BOTONES FLOTANTES */
            <div className="flex flex-col h-full relative bg-slate-950">
              {/* Barra Superior del Visor */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-900/95 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver al listado</span>
                  </button>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase flex items-center gap-2">
                      <span>Factura PDF: {selectedDoc.number}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/70 text-emerald-300 border border-emerald-500/30">
                        Documento Original
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Emisor: {selectedDoc.issuerName} (CIF: {selectedDoc.issuerCif || '---'}) · Total: <span className="text-emerald-400 font-bold">{selectedDoc.total.toFixed(2)} €</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rawBase64 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleOpenPdfPopup(selectedDoc, e)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                        title="Abrir en ventana emergente / nueva pestaña"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                        <span>Ventana emergente</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDownloadOriginalPdf(selectedDoc, e)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                        title="Descargar archivo PDF original"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Descargar PDF</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedDoc(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenedor del Documento PDF Original */}
              <div className="flex-1 overflow-hidden p-2 sm:p-4 flex flex-col items-center justify-center pb-28 bg-slate-900/60">
                {rawBase64 ? (
                  <div className="w-full h-full max-w-5xl bg-slate-950 rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex flex-col">
                    {mimeType === 'application/pdf' ? (
                      <object
                        data={`data:application/pdf;base64,${rawBase64}#toolbar=1&navpanes=0`}
                        type="application/pdf"
                        className="w-full h-full rounded-2xl"
                      >
                        <iframe
                          src={`data:application/pdf;base64,${rawBase64}`}
                          className="w-full h-full rounded-2xl border-0"
                          title="Visor de Factura Original PDF"
                        />
                      </object>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-slate-950 overflow-auto">
                        <img
                          src={`data:${mimeType};base64,${rawBase64}`}
                          alt="Documento original de factura"
                          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback si el PDF no tiene base64 almacenado */
                  <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-8 text-center text-white shadow-xl">
                    <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Factura del Proveedor {selectedDoc.issuerName}
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
                      Nº Factura: <span className="font-mono font-bold text-white">{selectedDoc.number}</span> · Total: <span className="font-mono font-bold text-emerald-400">{selectedDoc.total.toFixed(2)} €</span>
                    </p>

                    {/* Resumen de conceptos */}
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 text-left mb-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conceptos extraídos:</p>
                      <div className="space-y-1.5">
                        {selectedDoc.items.map((it, i) => (
                          <div key={i} className="flex justify-between text-xs text-slate-300">
                            <span>• {it.description}</span>
                            <span className="font-mono font-bold text-emerald-400">{it.amount.toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTONERA FLOTANTE INFERIOR: VOLVER, RECHAZAR O INCORPORAR */}
              <div className="absolute bottom-4 inset-x-0 mx-auto max-w-2xl px-4 z-20">
                <div className="flex items-center justify-between gap-2.5 p-3 bg-slate-900/95 border-2 border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(null)}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-95 shrink-0"
                    title="Volver al listado"
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" />
                    <span>Volver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(selectedDoc.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-slate-800 hover:bg-rose-900 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-95"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="truncate">Rechazar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleIncorporate(selectedDoc)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-95"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    <span className="truncate">Incorporar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
