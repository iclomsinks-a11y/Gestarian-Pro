import React, { useState } from 'react';
import { 
  X, Send, MessageSquare, Mail, Copy, Check, ExternalLink, 
  Sparkles, Smartphone, CheckCircle2, ShieldCheck, ArrowRight, Loader2, Paperclip
} from 'lucide-react';
import { GestarianDocument, Client, AppUser } from '../types';
import { buildDocumentDispatchPayload, DispatchResult, sendDocumentViaApi } from '../services/documentDispatchService';

interface DocumentDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GestarianDocument | null;
  client: Client | null;
  currentUser: AppUser;
  onShowToast?: (msg: string, duration?: number) => void;
  onSentConfirmed?: () => void;
}

export const DocumentDispatchModal: React.FC<DocumentDispatchModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  client,
  currentUser,
  onShowToast,
  onSentConfirmed,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setIsSent(false);
    setIsSendingEmail(false);
    setStatusMessage(null);
    setSelectedChannel(null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !doc || !client) return null;

  // Si el usuario ha seleccionado un canal manualmente, usarlo; si no, calcular por defecto
  const dispatch: DispatchResult = buildDocumentDispatchPayload(
    doc, 
    client, 
    currentUser, 
    selectedChannel || undefined
  );
  const isWhatsApp = dispatch.channel === 'whatsapp';
  const docTypeLabel = doc.type === 'presupuesto' ? 'Presupuesto' : doc.type === 'factura' ? 'Factura' : 'Documento';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dispatch.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
    }
  };

  const handleExecuteDispatch = async () => {
    if (isWhatsApp) {
      if (dispatch.actionUrl) {
        window.open(dispatch.actionUrl, '_blank', 'noopener,noreferrer');
      }
      setIsSent(true);
      const msg = `${docTypeLabel} ${doc.number} enviado por WhatsApp con enlace ultra corto.`;
      setStatusMessage(msg);
      if (onShowToast) onShowToast(msg, 4000);
      if (onSentConfirmed) onSentConfirmed();
      setTimeout(() => onClose(), 1600);
    } else {
      // Envío DIRECTO por email en segundo plano SIN ABRIR GMAIL
      setIsSendingEmail(true);
      setStatusMessage(null);
      try {
        const result = await sendDocumentViaApi(dispatch, doc, currentUser);
        if (result.success) {
          setIsSent(true);
          const confirmMsg = `${docTypeLabel} ${doc.number} enviado por email a ${dispatch.recipient} con el documento adjunto correctamente.`;
          setStatusMessage(confirmMsg);
          if (onShowToast) {
            onShowToast(confirmMsg, 5000);
          }
          if (onSentConfirmed) onSentConfirmed();
          setTimeout(() => onClose(), 1800);
        } else {
          const errMsg = `Error al enviar email: ${result.error || 'No se pudo conectar con el servidor de correo'}`;
          setStatusMessage(errMsg);
          if (onShowToast) onShowToast(errMsg, 4500);
        }
      } catch (err: any) {
        const errMsg = `Error en el envío: ${err?.message || 'Error de red'}`;
        setStatusMessage(errMsg);
        if (onShowToast) onShowToast(errMsg, 4500);
      } finally {
        setIsSendingEmail(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white border border-[#CBD5E1] shadow-2xl rounded-2xl flex flex-col p-4 sm:p-6 max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-dispatch-title"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E0D8]">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isWhatsApp ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              {isWhatsApp ? <MessageSquare className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="modal-dispatch-title" className="text-base font-bold text-[#0F2942]">
                Enviar {docTypeLabel} {doc.number}
              </h3>
              <p className="text-xs text-[#64748B]">
                {isWhatsApp ? 'WhatsApp con enlace ultra corto' : 'Envío directo por Email con documento adjunto'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors cursor-pointer"
            title="Cerrar ventana de envío"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Selector de Canal (WhatsApp o Email) */}
        <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setSelectedChannel('whatsapp')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isWhatsApp 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp (Enlace Corto)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedChannel('email')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !isWhatsApp 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/60'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Directo (Con Adjunto)</span>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="py-3 space-y-3 overflow-y-auto flex-1 text-xs">
          {/* Tarjeta de información del canal */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isWhatsApp ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-blue-50/70 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-sm bg-white/80 shadow-2xs">
                Destinatario:
              </span>
              <span className="font-mono text-[11px] font-bold">
                {dispatch.recipient}
              </span>
            </div>
            <span className="text-[10px] font-semibold">
              {isWhatsApp ? '📱 WhatsApp Web / App' : '✉️ Servidor Resend API'}
            </span>
          </div>

          {/* Información de Adjunto para Email */}
          {!isWhatsApp && (
            <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center gap-2.5 text-[#166534]">
              <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-[11px] leading-snug">
                <strong>Documento adjunto:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900">{docTypeLabel}_{doc.number}.pdf</code>
                <span className="block text-[10px] text-emerald-700 mt-0.5">Se enviará en segundo plano directamente al buzón del cliente sin abrir la app de Gmail.</span>
              </div>
            </div>
          )}

          {/* Tarjeta de Enlace Ultra Corto notificaciones.gestrian */}
          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F2942] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Enlace Oficial Ultra Corto:</span>
              </span>
              <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                notificaciones.gestrian
              </span>
            </div>
            <a
              href={dispatch.shortUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center gap-1.5 bg-white p-2 rounded-lg border border-blue-100 truncate"
              title={dispatch.shortUrl}
            >
              <span className="truncate">{dispatch.shortUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-auto text-blue-500" />
            </a>
            <p className="text-[10px] text-[#64748B]">
              Permite al cliente visualizar el documento oficial en A4, descargarlo en PDF, compartirlo o aceptarlo.
            </p>
          </div>

          {/* Vista previa del mensaje */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#334155]">
                {isWhatsApp ? 'Mensaje para WhatsApp:' : 'Contenido del Correo:'}
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F2942] hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copiado al portapapeles' : 'Copiar texto'}</span>
              </button>
            </div>
            <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-[11px] leading-relaxed text-[#1E293B] whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
              {dispatch.message}
            </div>
          </div>

          {/* Notificación de estado de envío */}
          {statusMessage && (
            <div className={`p-3 rounded-xl flex items-center gap-2 border ${
              isSent 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSent ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span className="font-semibold text-[11px]">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Pie de botones */}
        <div className="pt-3 border-t border-[#E2E0D8] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cancelar</span>
          </button>

          <button
            type="button"
            disabled={isSendingEmail || isSent}
            onClick={handleExecuteDispatch}
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
              isWhatsApp ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSendingEmail ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando directamente...</span>
              </>
            ) : isWhatsApp ? (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Enviar por Email Directo</span>
              </>
            )}
            {!isSendingEmail && !isSent && <ArrowRight className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
};
