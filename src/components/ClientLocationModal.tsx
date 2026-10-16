import React, { useState, useEffect } from 'react';
import { Home, X, Save, MapPin, ExternalLink, Check, Copy } from 'lucide-react';
import { Client } from '../types';

interface ClientLocationModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (client: Client, taskLocation: string) => void;
}

export const ClientLocationModal: React.FC<ClientLocationModalProps> = ({
  isOpen,
  client,
  onClose,
  onSave,
}) => {
  const [taskLocation, setTaskLocation] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (client) {
      setTaskLocation(client.taskLocation || client.address || '');
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleUseClientAddress = () => {
    if (client.address) {
      setTaskLocation(client.address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleOpenGoogleMaps = () => {
    const loc = taskLocation.trim() || client.address?.trim();
    if (loc) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(loc)}`, '_blank');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(client, taskLocation.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Home className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-wide leading-tight">
                Localización de la Tarea
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium truncate max-w-xs sm:max-w-sm">
                Cliente: <span className="font-bold text-white">{client.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
          {/* Dirección fiscal / de contacto del cliente */}
          {client.address && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Dirección registrada del cliente
                </span>
                <button
                  type="button"
                  onClick={handleUseClientAddress}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Copiar esta dirección al campo de localización"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiada</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Usar en tarea</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {client.address}
              </p>
            </div>
          )}

          {/* Campo principal de localización */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-700" />
              Lugar donde se realiza la tarea *
            </label>
            <textarea
              rows={3}
              value={taskLocation}
              onChange={(e) => setTaskLocation(e.target.value)}
              placeholder="Introduce la dirección, nave, obra o ubicación exacta de la tarea..."
              className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-slate-900 text-sm sm:text-base outline-none resize-none transition-colors shadow-2xs placeholder-slate-400"
              required
            />
            <span className="text-[11px] text-slate-500">
              Esta ubicación se precargará automáticamente al generar presupuestos o facturas para este cliente.
            </span>
          </div>

          {/* Acciones */}
          <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              disabled={!taskLocation.trim() && !client.address?.trim()}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver en Maps</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
