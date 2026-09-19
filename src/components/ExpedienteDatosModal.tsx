import React, { useState } from 'react';
import { X, ClipboardList, User, Users, Wrench, Phone, CheckCircle2 } from 'lucide-react';
import { GestarianDocument, Client, AppUser } from '../types';
import { DocumentViewerModal } from './DocumentViewerModal';

interface ExpedienteDatosModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GestarianDocument;
  client?: Client;
  currentUser: AppUser;
  allDocuments?: GestarianDocument[];
  onUpdateDocument?: (doc: GestarianDocument) => void;
  onShowToast?: (msg: string) => void;
}

export const ExpedienteDatosModal: React.FC<ExpedienteDatosModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  client,
  currentUser,
  allDocuments = [],
  onUpdateDocument,
  onShowToast,
}) => {
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>(
    doc.assignedEmployeeId || ''
  );
  const [viewBudgetModalOpen, setViewBudgetModalOpen] = useState<boolean>(false);

  React.useEffect(() => {
    setAssignedEmployeeId(doc.assignedEmployeeId || '');
  }, [doc.assignedEmployeeId]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAssignEmployee = (empId: string) => {
    setAssignedEmployeeId(empId);
    if (onUpdateDocument) {
      const updated: GestarianDocument = {
        ...doc,
        assignedEmployeeId: empId || undefined,
      };
      onUpdateDocument(updated);
      const emp = currentUser.employees?.find((e) => e.id === empId);
      if (onShowToast) {
        onShowToast(emp ? `Empleado ${emp.name} asignado al expediente.` : 'Asignación de empleado retirada.');
      }
    }
  };

  const assignedEmployee = currentUser.employees?.find((e) => e.id === assignedEmployeeId);

  // Números limpios
  const budgetNumberOnly = (() => {
    if (doc.type === 'budget') return doc.number;
    if (doc.linkedBudgetNumber) return doc.linkedBudgetNumber;
    const numDigits = doc.number.replace(/\D/g, '');
    return numDigits ? `P${numDigits}` : 'P-26001';
  })();

  const expedienteNumberOnly = (() => {
    if (doc.expediente) return doc.expediente;
    const numDigits = doc.number.replace(/\D/g, '');
    return numDigits ? `EXP-${numDigits}` : 'EXP-26001';
  })();

  const phoneClean = (client?.phone || doc.clientPhone || '').replace(/\D/g, '');

  const budgetDoc = (() => {
    if (doc.type === 'budget') return doc;
    const found = allDocuments.find(
      (d) => d.type === 'budget' && (d.expediente === doc.expediente || d.id === doc.linkedBudgetId || d.number === doc.linkedBudgetNumber)
    );
    if (found) return found;
    return {
      ...doc,
      type: 'budget' as const,
      number: budgetNumberOnly,
    };
  })();

  return (
    <>
      <div
        id="modal-datos-expediente"
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white w-full h-full sm:h-auto sm:w-[80vw] lg:w-[60vw] sm:max-h-[92vh] rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl border-none sm:border sm:border-slate-200 flex flex-col overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón Cerrar flotante en esquina superior derecha (sin header) */}
          <button
            id="btn-close-datos-modal"
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2.5 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Contenido Principal */}
          <div className="p-4 sm:p-6 sm:pt-8 overflow-y-auto space-y-6 sm:space-y-6 flex-1 bg-white sm:bg-[#F8FAFC]">
            
            {/* Bloque 1: Datos del Expediente */}
            <div className="bg-transparent sm:bg-white rounded-none sm:rounded-2xl border-b sm:border border-slate-100 sm:border-slate-200 pb-6 sm:p-6 shadow-none sm:shadow-xs flex flex-col items-center">
              
              {/* Fila superior: Número de presupuesto a la izq, Matrícula al centro, Expediente a la dcha */}
              <div className="w-full flex items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-4 pt-6 sm:pt-0">
                {/* Presupuesto solo el número sin envoltorio ni texto */}
                <div className="flex flex-col items-start min-w-[70px] sm:min-w-[100px]">
                  <span className="text-sm sm:text-base font-black text-amber-800 font-mono tracking-tight">
                    {budgetNumberOnly}
                  </span>
                </div>

                {/* Matrícula arriba centrada */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="flex items-center bg-white border-2 border-slate-700 rounded-lg overflow-hidden h-9 sm:h-11 shadow-xs">
                    <div className="bg-blue-700 h-full w-6 sm:w-7 flex flex-col items-center justify-center shrink-0 px-1">
                      <span className="text-[6px] sm:text-[7px] text-yellow-300 font-bold mb-0.5 leading-none">⭐</span>
                      <span className="text-[10px] sm:text-xs text-white font-black leading-none">E</span>
                    </div>
                    <div className="px-3 sm:px-4 font-mono font-black text-base sm:text-xl tracking-widest text-[#0F172A]">
                      {doc.vehiclePlate || 'SIN-MAT'}
                    </div>
                  </div>
                </div>

                {/* Expediente sólo el número sin envoltorio ni texto */}
                <div className="flex flex-col items-end min-w-[70px] sm:min-w-[100px]">
                  <span className="text-sm sm:text-base font-black text-blue-900 font-mono tracking-tight">
                    {expedienteNumberOnly}
                  </span>
                </div>
              </div>

              {/* Debajo: Marca y Modelo */}
              <div className="text-center mb-1">
                <span className="text-base sm:text-lg font-black text-[#0F172A] uppercase tracking-wide">
                  {[doc.vehicleBrand, doc.vehicleModel].filter(Boolean).join(' ') || doc.vehicleType || 'Vehículo Taller'}
                </span>
              </div>

              {/* Debajo: Nombre del Titular */}
              <div className="text-center mb-5">
                <span className="text-sm sm:text-base font-semibold text-slate-600 block">
                  {client?.name || doc.clientName || 'Cliente sin especificar'}
                </span>
              </div>

              {/* Debajo: Iconos de acción flotantes SIN recuadro de fondo */}
              <div className="flex items-center justify-center gap-6 sm:gap-8 pt-1">
                {/* Icono de ver presupuesto minimalista flotante con la P dentro de la hoja sin recuadro de fondo */}
                <button
                  id="btn-ver-presupuesto-hoja-p"
                  type="button"
                  onClick={() => setViewBudgetModalOpen(true)}
                  title="Ver Presupuesto"
                  className="group relative transition-transform hover:scale-115 active:scale-100 flex items-center justify-center cursor-pointer p-1"
                >
                  <div className="relative w-8 h-9 flex items-center justify-center">
                    <svg className="w-full h-full text-amber-600 drop-shadow-xs" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3C3 1.89543 3.89543 1 5 1H13.5858C14.1162 1 14.6249 1.21071 15 1.58579L20.4142 7C20.7893 7.3751 21 7.88378 21 8.41421V25C21 26.1046 20.1046 27 19 27H5C3.89543 27 3 26.1046 3 25V3Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M13 1V8H20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-black text-amber-700 text-sm sm:text-base pt-0.5 tracking-tighter select-none">
                      P
                    </span>
                  </div>
                  <span className="absolute -bottom-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-sm">
                    Ver Presupuesto
                  </span>
                </button>

                {/* Icono de WhatsApp sin recuadro de fondo */}
                {phoneClean ? (
                  <a
                    id="btn-whatsapp-cliente"
                    href={`https://wa.me/${phoneClean.startsWith('34') ? phoneClean : '34' + phoneClean}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Enviar WhatsApp"
                    className="group relative transition-transform hover:scale-115 active:scale-100 flex items-center justify-center cursor-pointer text-emerald-500 hover:text-emerald-600 p-1"
                  >
                    <svg className="w-8 h-8 fill-current drop-shadow-xs" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.105 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span className="absolute -bottom-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-sm">
                      WhatsApp
                    </span>
                  </a>
                ) : null}

                {/* Icono de Teléfono sin recuadro de fondo */}
                {phoneClean ? (
                  <a
                    id="btn-telefono-cliente"
                    href={`tel:${phoneClean}`}
                    title="Llamar al cliente"
                    className="group relative transition-transform hover:scale-115 active:scale-100 flex items-center justify-center cursor-pointer text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Phone className="w-7 h-7 drop-shadow-xs" />
                    <span className="absolute -bottom-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-sm">
                      Llamar ({phoneClean})
                    </span>
                  </a>
                ) : null}
              </div>
            </div>

            {/* Bloque 2: Empleados Asignados */}
            <div className="bg-transparent sm:bg-white rounded-none sm:rounded-2xl border-b sm:border border-slate-100 sm:border-slate-200 pb-6 sm:p-5 shadow-none sm:shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2 text-[#0F2942] font-black text-sm uppercase tracking-wider">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Empleados Asignados</span>
                </div>
                {assignedEmployee ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded border border-emerald-200">
                    Asignado
                  </span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded border border-slate-200">
                    Sin asignar
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Operario / Mecánico Responsable:
                  </label>
                  <select
                    id="select-assigned-employee"
                    value={assignedEmployeeId}
                    onChange={(e) => handleAssignEmployee(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Cualquier operario disponible / Sin asignar</option>
                    {currentUser.employees?.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.profession ? `(${emp.profession})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {assignedEmployee && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-emerald-950">{assignedEmployee.name}</div>
                      <div className="text-xs text-emerald-700">
                        {assignedEmployee.profession || 'Mecánico / Operario'} {assignedEmployee.phone ? `· ${assignedEmployee.phone}` : ''}
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Bloque 3: Trabajo a Realizar */}
            <div className="bg-transparent sm:bg-white rounded-none sm:rounded-2xl border-0 sm:border border-slate-200 p-0 sm:p-5 shadow-none sm:shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2 text-[#0F2942] font-black text-sm uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-orange-600" />
                  <span>Trabajo a Realizar</span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {doc.items?.length || 0} {doc.items?.length === 1 ? 'tarea' : 'tareas'}
                </span>
              </div>

              {(!doc.items || doc.items.length === 0) ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No hay operaciones ni tareas registradas en este expediente.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {doc.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{item.description}</div>
                          {item.quantity > 0 && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Cantidad: {item.quantity} {item.unitPrice > 0 ? `× ${item.unitPrice.toFixed(2)} €` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      {item.amount > 0 && (
                        <div className="text-sm font-bold text-[#0F172A] whitespace-nowrap">
                          {item.amount.toFixed(2)} €
                        </div>
                      )}
                    </div>
                  ))}

                  {doc.total > 0 && (
                    <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-[#0F172A] px-1">
                      <span>Total estimado del trabajo:</span>
                      <span className="text-base text-blue-700">{doc.total.toFixed(2)} €</span>
                    </div>
                  )}
                </div>
              )}

              {doc.notes && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-1">Observaciones / Notas:</span>
                  <p className="whitespace-pre-line">{doc.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Visor de Presupuesto Integrado */}
      <DocumentViewerModal
        isOpen={viewBudgetModalOpen}
        document={budgetDoc}
        onClose={() => setViewBudgetModalOpen(false)}
        onConfirmInvoice={() => {}}
        onSendInvoice={() => {}}
        onAcceptBudget={() => {}}
        onConvertToInvoice={() => {}}
        onEditDocument={() => {}}
        onOpenAgendaForBudget={() => {}}
      />
    </>
  );
};
