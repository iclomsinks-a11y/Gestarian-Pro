import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { StandardCard } from './StandardCard';
import { AppUser, Employee, GestarianDocument } from '../types';
import { Search, Wrench, FolderKanban, Play, UserCheck, CheckCircle2, Users, Filter, Check, LogOut } from 'lucide-react';
import { AssignEmployeeModal } from './AssignEmployeeModal';

interface TallerCardsViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  documents: GestarianDocument[];
  currentUser?: AppUser;
  loggedEmployeeSession?: Employee | null;
  onLogoutEmployeeSession?: () => void;
  onBack: () => void;
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onOpenWorkOrdersModal: () => void;
  onNavigateToExpediente?: (expedienteId: string) => void;
  onUpdateDocument?: (updatedDoc: GestarianDocument) => void;
  onShowToast?: (msg: string, duration?: number) => void;
}

export const TallerCardsView: React.FC<TallerCardsViewProps> = ({
  id,
  logoUrl,
  userFullName,
  documents,
  currentUser,
  loggedEmployeeSession,
  onLogoutEmployeeSession,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onOpenWorkOrdersModal,
  onNavigateToExpediente,
  onUpdateDocument,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [assigningDoc, setAssigningDoc] = useState<GestarianDocument | null>(null);
  const [filterOnlyMyRepairs, setFilterOnlyMyRepairs] = useState<boolean>(Boolean(loggedEmployeeSession));

  // Trabajos de taller (órdenes de trabajo o presupuestos con vehículo)
  const workOrders = documents.filter(
    (d) => d.type === 'orden_trabajo' || d.vehiclePlate || d.assignedEmployeeId
  );

  const myWorkOrdersCount = loggedEmployeeSession
    ? workOrders.filter(
        (d) =>
          d.assignedEmployeeId === loggedEmployeeSession.id ||
          (d.createdByName && d.createdByName.toLowerCase().includes(loggedEmployeeSession.name.toLowerCase()))
      ).length
    : 0;

  const filtered = workOrders.filter((doc) => {
    if (filterOnlyMyRepairs && loggedEmployeeSession) {
      const isAssignedToMe =
        doc.assignedEmployeeId === loggedEmployeeSession.id ||
        (doc.createdByName && doc.createdByName.toLowerCase().includes(loggedEmployeeSession.name.toLowerCase()));
      if (!isAssignedToMe) return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      doc.clientName.toLowerCase().includes(q) ||
      (doc.vehiclePlate && doc.vehiclePlate.toLowerCase().includes(q)) ||
      doc.number.toLowerCase().includes(q)
    );
  });

  const handleConfirmAssignment = (docId: string, employeeId: string, employeeName: string) => {
    const targetDoc = documents.find(d => d.id === docId);
    if (!targetDoc) return;

    const updated: GestarianDocument = {
      ...targetDoc,
      tallerStatus: 'en_reparacion',
      workOrderStatus: 'en_ejecucion',
      facturacionStatus: 'finalizar_reparacion',
      assignedEmployeeId: employeeId,
      createdByName: employeeName,
    };

    if (onUpdateDocument) {
      onUpdateDocument(updated);
    }

    if (onShowToast) {
      onShowToast(`REPARACIÓN EN PROCESO. Empleado asignado: ${employeeName}`, 6000);
    }
  };

  const handleFinishRepair = (doc: GestarianDocument) => {
    const updated: GestarianDocument = {
      ...doc,
      tallerStatus: 'reparacion_finalizada',
      workOrderStatus: 'finalizada',
      facturacionStatus: 'finalizar_reparacion',
    };

    if (onUpdateDocument) {
      onUpdateDocument(updated);
    }

    if (onShowToast) {
      const operarioText = loggedEmployeeSession ? ` por ${loggedEmployeeSession.name}` : '';
      onShowToast(`REPARACIÓN FINALIZADA${operarioText}. Expediente ${doc.expediente || doc.number} marcado como finalizado.`, 6000);
    }
  };

  return (
    <div id={id} className="min-h-screen bg-[#FDFBF7] flex flex-col snap-start shrink-0 w-full overflow-y-auto">
      <PageHeader
        title="Taller"
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        onOpenMenu={onOpenMenu}
        logoUrl={logoUrl}
        userFullName={userFullName}
      />

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* Banner de Autorizado Activo */}
        {loggedEmployeeSession && (
          <div className="bg-gradient-to-r from-[#0F2942] to-[#1E3A8A] text-white rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 border border-sky-400/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/60 border border-sky-300/40 flex items-center justify-center font-bold text-white text-sm shrink-0">
                <Users className="w-5 h-5 text-sky-200" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider block">
                  Sesión de Autorizado Activa
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>{loggedEmployeeSession.name}</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 bg-sky-500/30 border border-sky-300/30 rounded-full text-sky-100">
                    {loggedEmployeeSession.profession || 'Oficial de Taller'}
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterOnlyMyRepairs(!filterOnlyMyRepairs)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterOnlyMyRepairs
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{filterOnlyMyRepairs ? `Ver Todas (${workOrders.length})` : `Solo Mis Reparaciones (${myWorkOrdersCount})`}</span>
              </button>

              {onLogoutEmployeeSession && (
                <button
                  type="button"
                  onClick={onLogoutEmployeeSession}
                  className="p-1.5 bg-white/10 hover:bg-red-500/80 text-white rounded-lg transition-colors cursor-pointer"
                  title="Cerrar sesión de autorizado"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Barra superior con buscador y acceso al modal de OTs */}
        <div className="bg-white border border-[#E2E0D8] rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por matrícula, cliente u orden..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg outline-none focus:border-[#0F2942]"
            />
          </div>

          <button
            type="button"
            onClick={onOpenWorkOrdersModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Panel de Órdenes de Trabajo</span>
          </button>
        </div>

        {/* Tarjetas con el mismo formato que Facturas Emitidas */}
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs space-y-2">
            <p>No hay vehículos ni órdenes en taller que coincidan con la búsqueda.</p>
            {filterOnlyMyRepairs && (
              <button
                type="button"
                onClick={() => setFilterOnlyMyRepairs(false)}
                className="text-blue-600 font-bold underline cursor-pointer hover:text-blue-800"
              >
                Ver todas las órdenes del taller ({workOrders.length})
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((doc) => {
              const subtitle = [doc.vehicleBrand, doc.vehicleModel || doc.vehicleType].filter(Boolean).join(' ') || 'Turismo';

              const isEnProceso = doc.tallerStatus === 'en_reparacion' || doc.workOrderStatus === 'en_ejecucion';
              const isFinalizado = doc.tallerStatus === 'reparacion_finalizada' || doc.workOrderStatus === 'finalizada';

              let statusText = 'PENDIENTE';
              let statusColor = 'border-[3px] border-amber-500 bg-amber-50/20';
              let statusTextColor = 'text-amber-600 font-bold';

              if (isEnProceso) {
                statusText = 'EN PROCESO';
                statusColor = 'border-[3px] border-blue-600 bg-blue-50/20';
                statusTextColor = 'text-blue-600 font-black';
              } else if (isFinalizado) {
                statusText = 'REPARACIÓN FINALIZADA';
                statusColor = 'border-[3px] border-emerald-500 bg-emerald-50/20';
                statusTextColor = 'text-emerald-600 font-bold';
              }

              const assignedEmp = currentUser?.employees?.find(e => e.id === doc.assignedEmployeeId);
              const employeeName = assignedEmp ? assignedEmp.name : (doc.createdByName || 'Sin Asignar');
              const isAssignedToCurrentSession = loggedEmployeeSession && (doc.assignedEmployeeId === loggedEmployeeSession.id || (doc.createdByName && doc.createdByName.toLowerCase().includes(loggedEmployeeSession.name.toLowerCase())));

              return (
                <StandardCard
                  key={doc.id}
                  status={statusText}
                  statusColor={statusColor}
                  statusTextColor={statusTextColor}
                  vehiclePlate={doc.vehiclePlate || 'SIN-MAT'}
                  subtitle={subtitle}
                  title={doc.clientName}
                  refCode={`OT-${doc.number}`}
                  expediente={doc.expediente || 'E260001'}
                  isExpandable={true}
                  actions={
                    <div className="flex flex-col gap-3">
                      <div className="text-xs text-[#64748B] flex items-center justify-between">
                        <span>
                          Operario: <strong className="text-[#0F2942] font-bold">{employeeName}</strong>
                          {isAssignedToCurrentSession && (
                            <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-900 font-black px-1.5 py-0.5 rounded border border-blue-300">
                              MÍO
                            </span>
                          )}
                        </span>
                        <span>F. Entrega: <strong>{doc.vehicleDeliveryDate || doc.date}</strong></span>
                      </div>

                      {/* Botón destacado para Finalizar Reparación si está en proceso */}
                      {isEnProceso && (
                        <button
                          type="button"
                          onClick={() => handleFinishRepair(doc)}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Finalizar Reparación</span>
                        </button>
                      )}

                      <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setAssigningDoc(doc)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors p-2 cursor-pointer"
                          title="Asignar o Cambiar Operario"
                        >
                          <Users className="w-4 h-4" />
                          <span>{isEnProceso ? 'Cambiar Operario' : 'Asignar / En Proceso'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={onOpenWorkOrdersModal}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0F2942] hover:text-[#1E3A8A] transition-colors p-2 cursor-pointer"
                          title="Gestionar Orden"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>Gestionar OT</span>
                        </button>

                        {onNavigateToExpediente && doc.expediente && (
                          <button
                            type="button"
                            onClick={() => onNavigateToExpediente(doc.expediente!)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#38BDF8] hover:text-[#0284C7] transition-colors p-2 cursor-pointer"
                            title="Ver Roadmap de Reparación"
                          >
                            <FolderKanban className="w-4 h-4" />
                            <span>Roadmap</span>
                          </button>
                        )}
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {currentUser && assigningDoc && (
        <AssignEmployeeModal
          isOpen={Boolean(assigningDoc)}
          onClose={() => setAssigningDoc(null)}
          document={assigningDoc}
          currentUser={currentUser}
          onConfirmAssignment={handleConfirmAssignment}
        />
      )}
    </div>
  );
};
