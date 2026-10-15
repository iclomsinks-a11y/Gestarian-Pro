import React, { useState, useEffect } from 'react';
import { GestarianDocument, AppUser, Employee, WorkOrderStatus } from '../types';
import { X, Play, CheckCircle2, Clock, Wrench, ShieldAlert } from 'lucide-react';

interface WorkOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: GestarianDocument[];
  currentUser: AppUser;
  loggedEmployeeSession?: Employee | null;
  onUpdateStatus: (
    docId: string,
    status: WorkOrderStatus,
    employeeName?: string,
    orderNumber?: string
  ) => void;
}

export const WorkOrdersModal: React.FC<WorkOrdersModalProps> = ({
  isOpen,
  onClose,
  documents,
  currentUser,
  loggedEmployeeSession,
  onUpdateStatus,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  useEffect(() => {
    if (isOpen && loggedEmployeeSession && !selectedEmployeeId) {
      setSelectedEmployeeId(loggedEmployeeSession.id);
    }
  }, [isOpen, loggedEmployeeSession]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtrar documentos que son órdenes de trabajo o presupuestos con empleado/matrícula
  const workOrders = documents.filter(
    (d) => d.type === 'orden_trabajo' || d.assignedEmployeeId || d.vehiclePlate
  );

  const selectedEmployee = currentUser.employees?.find((e) => e.id === selectedEmployeeId);
  const canSelectedEmployeeManage =
    !selectedEmployee ||
    selectedEmployee.permissions?.manageWorkOrders !== false; // true by default

  // Filtrar adicionalmente si se selecciona un empleado en concreto
  const displayedOrders = selectedEmployeeId 
    ? workOrders.filter(o => o.assignedEmployeeId === selectedEmployeeId || !o.assignedEmployeeId) 
    : workOrders;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'en_ejecucion':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm font-bold uppercase">
            <Wrench className="w-3 h-3" /> En Ejecución
          </span>
        );
      case 'finalizada':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm font-bold uppercase">
            <CheckCircle2 className="w-3 h-3" /> Finalizada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-sm font-bold uppercase">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
    }
  };

  const handleStartOrder = (order: GestarianDocument) => {
    const empName = selectedEmployee?.name ||
      currentUser.employees?.find((e) => e.id === order.assignedEmployeeId)?.name ||
      'Empleado Autorizado';
    onUpdateStatus(order.id, 'en_ejecucion', empName, order.expediente || order.number);
  };

  const handleFinishOrder = (order: GestarianDocument) => {
    const empName = selectedEmployee?.name ||
      currentUser.employees?.find((e) => e.id === order.assignedEmployeeId)?.name ||
      'Empleado Autorizado';
    onUpdateStatus(order.id, 'finalizada', empName, order.expediente || order.number);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#F8F7F3] border border-[#D5D2C9] rounded-sm shadow-xl overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E0D8] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#0F2942]" />
              Gestión de Órdenes de Trabajo (OT)
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Los trabajadores autorizados inician y finalizan órdenes generando notificaciones internas inmediatas.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-[#475569] border border-[#CBD5E1] rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Selector de empleado y permisos */}
        <div className="px-6 py-3 bg-[#F1F0EB] border-b border-[#E2E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase text-[#475569]">Vista del Operario / Autorizado:</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-sm font-semibold text-[#0F172A] outline-none"
            >
              <option value="">-- Todos los empleados / Vista General --</option>
              {currentUser.employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="text-[11px] text-[#475569] flex items-center gap-2">
              <span>Permiso OT:</span>
              {canSelectedEmployeeManage ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                  Activo (Iniciar / Finalizar)
                </span>
              ) : (
                <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-sm border border-red-200 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Sin permiso para OTs
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {displayedOrders.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#E2E0D8] rounded-sm">
              <Wrench className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
              <p className="text-sm font-semibold text-[#64748B]">No hay órdenes de trabajo activas.</p>
              <p className="text-xs text-[#94A3B8] mt-1">
                Crea un presupuesto o factura con matrícula/vehículo para generar automáticamente su orden de trabajo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedOrders.map((order) => {
                const assignedEmp = currentUser.employees?.find((e) => e.id === order.assignedEmployeeId);
                const currentStatus = order.workOrderStatus || (order.status === 'en_ejecucion' || order.status === 'finalizada' ? order.status : 'pendiente');
                
                return (
                  <div
                    key={order.id}
                    className="bg-white p-4 border border-[#E2E0D8] rounded-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-xs hover:border-[#CBD5E1] transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-[#EFECE6] px-1.5 py-0.5 rounded-sm">
                          {order.expediente || order.number}
                        </span>
                        {getStatusBadge(currentStatus)}
                      </div>
                      
                      <h4 className="text-sm font-bold text-[#0F172A]">{order.clientName}</h4>
                      
                      <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-x-3 gap-y-1">
                        {order.vehiclePlate && (
                          <span className="font-mono font-bold text-[#0F2942] bg-[#F1F5F9] px-1.5 py-0.5 rounded-sm border border-[#CBD5E1]">
                            Matrícula: {order.vehiclePlate}
                          </span>
                        )}
                        {order.vehicleType && (
                          <span>Tipo: <strong>{order.vehicleType}</strong></span>
                        )}
                        {order.vehicleDeliveryDate && (
                          <span>Entrega: <strong className="text-[#0F172A]">{order.vehicleDeliveryDate}</strong></span>
                        )}
                        <span>
                          Asignado: <strong className="text-[#0F172A]">{assignedEmp?.name || 'Cualquier Autorizado'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                      {currentStatus === 'pendiente' && (
                        <button
                          onClick={() => handleStartOrder(order)}
                          disabled={!canSelectedEmployeeManage}
                          className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 text-blue-700 border border-blue-200 text-xs font-bold uppercase rounded-sm transition-colors shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5" /> Iniciar («En ejecución»)
                        </button>
                      )}
                      {currentStatus === 'en_ejecucion' && (
                        <button
                          onClick={() => handleFinishOrder(order)}
                          disabled={!canSelectedEmployeeManage}
                          className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase rounded-sm transition-colors shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar («Finalizada»)
                        </button>
                      )}
                      {currentStatus === 'finalizada' && (
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-sm border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Trabajo Completado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con botón explícito de salida */}
        <div className="px-6 py-3.5 bg-[#F1F0EB] border-t border-[#E2E0D8] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#64748B]">
            {workOrders.length} orden{workOrders.length === 1 ? '' : 'es'} registrada{workOrders.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#0F172A] border border-[#CBD5E1] rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cerrar Órdenes de Trabajo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
