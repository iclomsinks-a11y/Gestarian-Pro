import React, { useState } from 'react';
import { 
  X, Send, MessageSquare, Mail, Copy, Check, ExternalLink, 
  Sparkles, Smartphone, CheckCircle2, ShieldCheck, ArrowRight, Loader2
} from 'lucide-react';
import { GestarianDocument, Client, AppUser } from '../types';
import { buildDocumentDispatchPayload, DispatchResult, sendDocumentViaApi } from '../services/documentDispatchService';

interface DocumentDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GestarianDocument | null;
  client: Client | null;
  currentUser: AppUser;
  onSentConfirmed?: () => void;
}

export const DocumentDispatchModal: React.FC<DocumentDispatchModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  client,
  currentUser,
  onSentConfirmed,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isSendingResend, setIsSendingResend] = useState(false);
  const [resendStatusMessage, setResendStatusMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !doc || !client) return null;

  const dispatch: DispatchResult = buildDocumentDispatchPayload(doc, client, currentUser);
  const isWhatsApp = dispatch.channel === 'whatsapp';

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
      if (onSentConfirmed) onSentConfirmed();
    } else {
      // Envio directo con Resend API via /api/send-document-dispatch
      setIsSendingResend(true);
      setResendStatusMessage(null);
      try {
        const result = await sendDocumentViaApi(dispatch, doc, currentUser);
        if (result.success) {
          setIsSent(true);
          setResendStatusMessage(
            result.isSimulated
              ? 'Simulado correctamente (configura RESEND_API_KEY para envio real).'
              : '¡Correo enviado con exito mediante Resend!'
          );
          if (onSentConfirmed) onSentConfirmed();
        } else {
          // Fallback: abrir mailto
          if (dispatch.actionUrl) window.open(dispatch.actionUrl, '_blank', 'noopener,noreferrer');
          setIsSent(true);
          setResendStatusMessage(`Respaldo: cliente de correo local abierto. (${result.error || ''})`);
          if (onSentConfirmed) onSentConfirmed();
        }
      } catch {
        if (dispatch.actionUrl) window.open(dispatch.actionUrl, '_blank', 'noopener,noreferrer');
        setIsSent(true);
      } finally {
        setIsSendingResend(false);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-2xl max-w-xl w-full p-6 my-auto max-h-[90vh] flex flex-col">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E0D8]">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${isWhatsApp ? 'bg-emerald-600' : 'bg-blue-600'}`}>
              {isWhatsApp ? <MessageSquare className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Envío Oficial ({isWhatsApp ? 'WhatsApp con Enlaces Cortos' : 'Correo con Resend API & Enlaces Cortos'})
              </h3>
              <p className="text-xs text-[#64748B]">
                Destinatario: <span className="font-semibold text-[#0F2942]">{client.name}</span> ({isWhatsApp ? 'Particular' : 'Empresa'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#64748B] hover:text-white hover:bg-rose-600 rounded-md transition-colors cursor-pointer"
            title="Cerrar ventana de envío"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Vista del Logo Incrustado del Usuario */}
          {dispatch.userLogoUrl && (
            <div className="bg-[#F8FAFC] border border-[#CBD5E1] p-3 rounded-lg flex items-center gap-3">
              <img 
                src={dispatch.userLogoUrl} 
                alt="Logo Empresa" 
                className="h-10 max-w-[140px] object-contain rounded-md border border-gray-200 bg-white p-1"
              />
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                  Logo Incrustado al Inicio del Mensaje
                </span>
                <p className="text-[11px] text-[#475569] mt-0.5">
                  Aparecerá en la vista previa superior de WhatsApp y la cabecera HTML de Resend.
                </p>
              </div>
            </div>
          )}

          {/* Tarjeta de información del canal */}
          <div className={`p-3 rounded-lg border flex items-center justify-between ${isWhatsApp ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-blue-50/70 border-blue-200 text-blue-900'}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-sm bg-white/80">
                Canal: {isWhatsApp ? 'WhatsApp (Enlaces Cortos)' : 'Email (Resend API)'}
              </span>
              <span className="font-mono text-[11px] font-semibold">
                {dispatch.recipient}
              </span>
            </div>
            <span className="text-[10px] font-semibold">
              {isWhatsApp ? 'Cliente particular' : 'Empresa / Sociedad CIF'}
            </span>
          </div>

          {/* Tarjeta de Enlaces Cortos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1. Documento PDF */}
            <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F2942] flex items-center gap-1">
                  <span>Documento PDF</span>
                </span>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Acceso directo corto
                </p>
              </div>
              <a
                href={dispatch.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1 mt-1 truncate"
                title={dispatch.shortUrl}
              >
                <span className="truncate">{dispatch.shortUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            {/* 2. Seguimiento en Área de Cliente */}
            <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F2942] flex items-center gap-1">
                  <span>Área de Cliente</span>
                </span>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Expediente: <strong className="text-[#0F172A]">{dispatch.expedienteNumber}</strong>
                </p>
              </div>
              <a
                href={dispatch.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1 mt-1 truncate"
                title={dispatch.trackingUrl}
              >
                <span className="truncate">{dispatch.trackingUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          {/* Vista previa del mensaje formateado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#334155]">
                Mensaje Corporativo Preparado:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F2942] hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado al portapapeles' : 'Copiar texto'}</span>
              </button>
            </div>
            <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-3 text-[11px] leading-relaxed text-[#1E293B] whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
              {dispatch.message}
            </div>
          </div>

          {/* Notificación de sincronización con la app cliente */}
          <div className="bg-[#EFF6FF] border border-blue-200 rounded-lg p-2.5 flex items-start gap-2 text-[#1E40AF]">
            <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-[11px] leading-snug">
              Si el cliente ya tiene instalada la app GESTARIAN en su teléfono, se sincronizará automáticamente y recibirá una notificación emergente para revisar el documento al instante.
            </p>
          </div>

          {isSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                {resendStatusMessage || `¡Documento preparado y canal de ${isWhatsApp ? 'WhatsApp' : 'correo de Resend'} ejecutado con éxito!`}
              </span>
            </div>
          )}
        </div>

        {/* Pie de botones */}
        <div className="pt-3 border-t border-[#E2E0D8] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cerrar Ventana</span>
          </button>

          <button
            type="button"
            disabled={isSendingResend}
            onClick={handleExecuteDispatch}
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors disabled:opacity-50 ${
              isWhatsApp ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSendingResend ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando con Resend...</span>
              </>
            ) : isWhatsApp ? (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Enviar por Correo (Resend)</span>
              </>
            )}
            {!isSendingResend && <ArrowRight className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
};

