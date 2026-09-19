import React, { useState } from 'react';
import { X, Bell, CheckCheck, Clock, Wrench, CheckCircle2, Trash2, Sparkles, Send, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { InternalNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InternalNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onDeleteNotification?: (id: string) => void;
  onViewOrder: (orderId?: string) => void;
  onOpenBudgetReview?: (budgetId?: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  onDeleteNotification,
  onViewOrder,
  onOpenBudgetReview,
}) => {
  const [showConfirmClearHistory, setShowConfirmClearHistory] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmClearHistory) {
          setShowConfirmClearHistory(false);
        } else if (itemToDelete) {
          setItemToDelete(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showConfirmClearHistory, itemToDelete]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' · ' +
        d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
      return isoString;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#F8F7F3] border border-[#D5D2C9] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E2E0D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0F2942] rounded-lg text-white shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                Avisos y Notificaciones METIS
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-red-600 text-white font-bold rounded-full">
                    {unreadCount} nuevas
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Gestión de alertas de presupuestos, talleres y estado de clientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-[#475569] border border-[#CBD5E1] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Cerrar notificaciones"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Toolbar actions */}
        <div className="px-5 py-2.5 bg-[#FAF9F5] border-b border-[#E2E0D8] flex items-center justify-between text-xs shrink-0">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] border border-blue-200 rounded-lg font-bold text-xs transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Marcar todo como leído</span>
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmClearHistory(true)}
            disabled={notifications.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Borrar historial</span>
          </button>
        </div>

        {/* Notification list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B] bg-white border border-[#E2E0D8] rounded-xl">
              <Bell className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
              <p className="font-semibold text-[#0F172A]">Bandeja vacía</p>
              <p className="text-[11px] text-[#94A3B8] mt-1 max-w-xs mx-auto">
                No hay avisos ni notificaciones de METIS pendientes en el historial.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isStatusChange = n.type === 'order_status_change';
              const isBudgetReview = n.type === 'metis_budget_review';
              const isInvoicePaid = n.type === 'metis_invoice_paid';

              return (
                <div
                  key={n.id}
                  className={`p-3.5 border rounded-xl transition-all relative ${
                    n.read
                      ? 'bg-white border-[#E2E0D8] opacity-85'
                      : isInvoicePaid
                      ? 'bg-emerald-50/90 border-emerald-300 shadow-xs'
                      : isBudgetReview
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : 'bg-[#EFF6FF] border-[#BFDBFE] shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isInvoicePaid ? (
                          <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : isBudgetReview ? (
                          <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        ) : n.newStatus === 'finalizada' ? (
                          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : n.newStatus === 'en_ejecucion' ? (
                          <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                            <Wrench className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                            <Clock className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#0F172A]">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="px-1.5 py-0.5 text-[9px] bg-blue-600 text-white font-bold rounded-full">
                              Sin leer
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#334155] leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-[#64748B] pt-0.5">
                          <span>{formatTime(n.timestamp)}</span>
                          {n.employeeName && (
                            <span>Operario: <strong className="text-[#0F172A]">{n.employeeName}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones por notificación: Marcar como leído y Borrar individual */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(n.id);
                          }}
                          className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Marcar como leído"
                        >
                          <Check className="w-3 h-3" />
                          <span>Marcar leído</span>
                        </button>
                      )}
                      {onDeleteNotification && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete(n.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Borrar este aviso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isBudgetReview && (
                    <div className="mt-2.5 pt-2 border-t border-amber-200 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenBudgetReview) {
                            onOpenBudgetReview(n.budgetId);
                          }
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-2xs"
                      >
                        <span>Terminar de cumplimentar presupuesto</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {isStatusChange && (
                    <div className="mt-2.5 pt-2 border-t border-[#CBD5E1]/40 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewOrder(n.orderId);
                          onClose();
                        }}
                        className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A] hover:underline"
                      >
                        Abrir Órdenes de Trabajo →
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal de Confirmación para Borrar Todo el Historial */}
        {showConfirmClearHistory && (
          <div className="absolute inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-5 max-w-sm w-full border border-rose-200 shadow-2xl space-y-3 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-100 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A]">¿Borrar todo el historial?</h3>
                  <p className="text-[11px] text-gray-500">Avisos de METIS y notificaciones</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 leading-relaxed">
                ¿Está seguro de que desea borrar completamente el historial de avisos de METIS? Esta acción eliminará permanentemente todas las notificaciones recibidas.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmClearHistory(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearNotifications();
                    setShowConfirmClearHistory(false);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sí, Borrar Historial</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación para Borrar Un Aviso Individual */}
        {itemToDelete && (
          <div className="absolute inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-5 max-w-sm w-full border border-rose-200 shadow-2xl space-y-3 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-100 rounded-lg shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A]">¿Borrar este aviso?</h3>
                  <p className="text-[11px] text-gray-500">Notificación individual</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 leading-relaxed">
                ¿Desea eliminar este aviso de METIS del historial?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteNotification) {
                      onDeleteNotification(itemToDelete);
                    }
                    setItemToDelete(null);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar Aviso</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer con botón de salida */}
        <div className="px-5 py-3 bg-[#FAF9F5] border-t border-[#E2E0D8] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#64748B]">
            Centro de notificaciones de METIS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-100 text-[#0F172A] border border-[#CBD5E1] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cerrar Notificaciones</span>
          </button>
        </div>
      </div>
    </div>
  );
};
