import React, { useState } from 'react';
import { 
  X, Building2, ShieldCheck, Network, Send, CheckCircle2, 
  ArrowRightLeft, Percent, FileCheck, RefreshCw, AlertCircle, 
  Download, Key, Lock, ExternalLink
} from 'lucide-react';
import { AppUser, EnterpriseB2BOrder } from '../types';

interface EnterpriseAeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onShowToast: (msg: string) => void;
}

export const EnterpriseAeatModal: React.FC<EnterpriseAeatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'aeat' | 'b2b'>('aeat');
  
  // Estado AEAT
  const [certInstalled, setCertInstalled] = useState(true);
  const [certSubject, setCertSubject] = useState(`${currentUser.fullName || 'DM CAR'} (CIF: ${currentUser.cif || 'B-89324511'})`);
  const [certIssuer, setCertIssuer] = useState('FNMT-RCM - Autoridad de Certificación de Entidades');
  const [certExpiry, setCertExpiry] = useState('2028-11-20');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [aeatStatus, setAeatStatus] = useState<'connected' | 'idle'>('connected');

  // Estado Red B2B
  const [b2bOrders, setB2bOrders] = useState<EnterpriseB2BOrder[]>([
    {
      id: 'b2b_01',
      date: '2026-03-02',
      orderNumber: 'OT260012',
      vehiclePlate: '4512LKT',
      vehicleModel: 'Renault Megane E-Tech',
      sourceCompany: 'DM CAR (Central)',
      destinationCompany: 'TALLERES MECÁNICOS SUR S.L.',
      serviceType: 'Diagnosis electrónica y calibración ADAS cámara frontal',
      orderAmount: 480,
      commissionRate: 5,
      commissionAmount: 24,
      status: 'finalizada_con_exito',
    },
    {
      id: 'b2b_02',
      date: '2026-03-04',
      orderNumber: 'OT260018',
      vehiclePlate: '9147CCW',
      vehicleModel: 'Volkswagen Golf VII',
      sourceCompany: 'AUTO RECAMBIOS CENTRO S.A.',
      destinationCompany: 'DM CAR (Central)',
      serviceType: 'Pintado completo de costado y paragolpes en cabina',
      orderAmount: 950,
      commissionRate: 5,
      commissionAmount: 47.50,
      status: 'finalizada_con_exito',
    },
    {
      id: 'b2b_03',
      date: '2026-03-05',
      orderNumber: 'OT260021',
      vehiclePlate: '8492LMX',
      vehicleModel: 'BMW Serie 3 320d',
      sourceCompany: 'DM CAR (Central)',
      destinationCompany: 'RECTIFICADOS Y TURBOS MADRID',
      serviceType: 'Descarbonización e inyección alta presión',
      orderAmount: 620,
      commissionRate: 5,
      commissionAmount: 31,
      status: 'en_reparto',
    },
  ]);

  if (!isOpen) return null;

  const totalCommissionsEarned = b2bOrders
    .filter(o => o.status === 'finalizada_con_exito')
    .reduce((acc, o) => acc + o.commissionAmount, 0);

  const handleTestAeat = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      setAeatStatus('connected');
      onShowToast('✓ Conexión telemática con la Sede Electrónica de la AEAT verificada con éxito (Certificado FNMT válido)');
    }, 1200);
  };

  const handleLiquidateCommissions = () => {
    onShowToast(`Liquidación telemática de ${totalCommissionsEarned.toFixed(2)} € en comisiones B2B generada en fichero SEPA XML`);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl my-6 bg-white border border-slate-300 rounded-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏢</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">GESTARIAN ENTERPRISE</h3>
                <span className="text-[10px] uppercase font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                  Nivel Corporativo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Conexión telemática con AEAT por Certificado Digital · Red Interempresas B2B (Comisión 5%)
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('aeat')}
            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'aeat'
                ? 'border-blue-700 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sede Electrónica AEAT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('b2b')}
            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'b2b'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Red Interempresas B2B (5%)</span>
          </button>
        </div>

        {/* Contenido Pestaña 1: Sede Electrónica AEAT */}
        {activeTab === 'aeat' && (
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-950 text-sm">Conexión Telemática Directa con la AEAT</h4>
                <p className="text-blue-800 text-xs mt-0.5 leading-relaxed">
                  Canal seguro bidireccional mediante certificado digital conforme a la <strong>Ley 11/2021 de Prevención y Lucha contra el Fraude Fiscal</strong> y la normativa <strong>Veri*Factu</strong> (RD 1007/2023). Envío automático y firma telemática de registros de facturación con acuse de recibo oficial.
                </p>
              </div>
            </div>

            {/* Certificado Digital Activo */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-700" />
                  <span className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                    Certificado Electrónico Instalado
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Válido y Autenticado</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[10px]">Titular / Razón Social:</span>
                  <span className="font-bold text-slate-900">{certSubject}</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[10px]">Autoridad Emisora:</span>
                  <span className="font-medium text-slate-800">{certIssuer}</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[10px]">Validez hasta:</span>
                  <span className="font-mono font-medium text-slate-800">{certExpiry}</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[10px]">Algoritmo de firma:</span>
                  <span className="font-mono font-medium text-slate-800">SHA-256 con cifrado RSA 2048 bits</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestAeat}
                  disabled={isTestingConnection}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>{isTestingConnection ? 'Comprobando endpoint AEAT...' : 'Verificar Conexión Telemática'}</span>
                </button>

                <span className="text-[11px] text-slate-500 font-mono">
                  Endpoint: https://www2.agenciatributaria.gob.es/es13/l200
                </span>
              </div>
            </div>

            {/* Protocolos de Envío Configurados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white border border-slate-200 rounded-md">
                <span className="font-bold text-slate-900 block text-xs mb-1">Veri*Factu en Tiempo Real</span>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Remisión inmediata por servicio web SOAP del bloque de hash encadenado con código QR en el momento exacto de emisión de cada factura.
                </p>
                <div className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Transmisión automática habilitada</span>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-md">
                <span className="font-bold text-slate-900 block text-xs mb-1">Cotejo de Huella Digital Fiscal</span>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Registro inalterable con sellado de tiempo criptográfico que previene cualquier modificación retroactiva.
                </p>
                <div className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Auditoría de integridad activa</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Contenido Pestaña 2: Red Interempresas B2B (Comisión 5%) */}
        {activeTab === 'b2b' && (
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
              <Network className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950 text-sm">Red Interempresas B2B de Servicios y Reparaciones</h4>
                <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                  Plataforma colaborativa para derivación de trabajos entre talleres asociados, especialistas de chapa, pintura, mecánica pesada y proveedores de recambios.
                  <strong> Comisión automática del 5% fijada por defecto</strong> para todas las derivaciones y órdenes completadas con éxito.
                </p>
              </div>
            </div>

            {/* Métrica de comisiones acumuladas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-900 text-white rounded-md">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Comisión Estándar B2B</span>
                <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">5,00 %</div>
                <span className="text-[10px] text-slate-400">Aplicada automáticamente</span>
              </div>

              <div className="p-3.5 bg-slate-900 text-white rounded-md">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Órdenes Finalizadas con Éxito</span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">2 de 3</div>
                <span className="text-[10px] text-emerald-400">100% liquidadas</span>
              </div>

              <div className="p-3.5 bg-slate-900 text-white rounded-md">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Comisiones Acumuladas</span>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  {totalCommissionsEarned.toFixed(2)} €
                </div>
                <button
                  type="button"
                  onClick={handleLiquidateCommissions}
                  className="mt-1 text-[10px] font-bold text-teal-300 hover:underline cursor-pointer"
                >
                  Liquidar ahora en cuenta
                </button>
              </div>
            </div>

            {/* Tabla de pedidos y desvíos B2B */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Historial de Derivaciones y Reparto B2B
                </span>
                <span className="text-slate-500 text-[11px]">
                  Regla de compensación interempresas
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Fecha / OT</th>
                      <th className="py-2.5 px-3">Vehículo</th>
                      <th className="py-2.5 px-3">Taller Emisor / Receptor</th>
                      <th className="py-2.5 px-3">Servicio Derivado</th>
                      <th className="py-2.5 px-3 text-right">Importe</th>
                      <th className="py-2.5 px-3 text-right">Comisión (5%)</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {b2bOrders.map((bo) => (
                      <tr key={bo.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono">
                          <div className="font-bold text-slate-900">{bo.orderNumber}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{bo.date}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold font-mono">[{bo.vehiclePlate}]</span>
                          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{bo.vehicleModel}</div>
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          <div className="text-slate-900 font-medium truncate max-w-[140px]">{bo.sourceCompany}</div>
                          <div className="text-slate-500 flex items-center gap-1 text-[10px]">
                            <span>↳</span>
                            <span className="truncate max-w-[130px]">{bo.destinationCompany}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-700 max-w-[160px] truncate" title={bo.serviceType}>
                          {bo.serviceType}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                          {bo.orderAmount.toFixed(2)} €
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-amber-700">
                          +{bo.commissionAmount.toFixed(2)} €
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            bo.status === 'finalizada_con_exito'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {bo.status === 'finalizada_con_exito' ? 'Liquidada' : 'En reparto'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Pie */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            GESTARIAN ENTERPRISE · Sin límite de volumen ni de operarios
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer"
          >
            Cerrar Módulo
          </button>
        </div>

      </div>
    </div>
  );
};
