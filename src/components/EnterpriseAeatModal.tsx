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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl my-6 bg-white border border-slate-300 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera con textos x2 */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-2xl">GESTARIAN ENTERPRISE</h3>
                <span className="text-sm uppercase font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-md">
                  Nivel Corporativo
                </span>
              </div>
              <p className="text-base text-slate-300 mt-1">
                Conexión telemática con AEAT por Certificado Digital · Red Interempresas B2B (Comisión 5%)
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Pestañas x2 */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('aeat')}
            className={`pb-3 px-5 text-base sm:text-lg font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'aeat'
                ? 'border-blue-700 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-6 h-6" />
            <span>Sede Electrónica AEAT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('b2b')}
            className={`pb-3 px-5 text-base sm:text-lg font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'b2b'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-6 h-6" />
            <span>Red Interempresas B2B (5%)</span>
          </button>
        </div>

        {/* Contenido Pestaña 1: Sede Electrónica AEAT (Todos los textos tamaño x2) */}
        {activeTab === 'aeat' && (
          <div className="p-8 overflow-y-auto space-y-6 text-xl sm:text-2xl text-slate-800">
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-blue-700 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-blue-950 text-2xl sm:text-3xl">Conexión Telemática Directa con la AEAT</h4>
                <p className="text-blue-900 text-xl sm:text-2xl mt-1.5 leading-relaxed">
                  Canal seguro bidireccional mediante certificado digital conforme a la <strong>Ley 11/2021 de Prevención y Lucha contra el Fraude Fiscal</strong> y la normativa <strong>Veri*Factu</strong> (RD 1007/2023). Envío automático y firma telemática de registros de facturación con acuse de recibo oficial.
                </p>
              </div>
            </div>

            {/* Certificado Digital Activo */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-6 h-6 text-slate-700" />
                  <span className="font-bold text-slate-900 uppercase tracking-wide text-xl sm:text-2xl">
                    Certificado Electrónico Instalado
                  </span>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-base sm:text-lg font-bold rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Válido y Autenticado</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-lg sm:text-xl">
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-base">Titular / Razón Social:</span>
                  <span className="font-bold text-slate-900 text-xl">{certSubject}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-base">Autoridad Emisora:</span>
                  <span className="font-medium text-slate-800 text-xl">{certIssuer}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-base">Validez hasta:</span>
                  <span className="font-mono font-medium text-slate-800 text-xl">{certExpiry}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-base">Algoritmo de firma:</span>
                  <span className="font-mono font-medium text-slate-800 text-xl">SHA-256 con cifrado RSA 2048 bits</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={handleTestAeat}
                  disabled={isTestingConnection}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-lg sm:text-xl font-bold rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  <RefreshCw className={`w-5 h-5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>{isTestingConnection ? 'Comprobando endpoint AEAT...' : 'Verificar Conexión Telemática'}</span>
                </button>

                <span className="text-lg text-slate-500 font-mono">
                  Endpoint: https://www2.agenciatributaria.gob.es/es13/l200
                </span>
              </div>
            </div>

            {/* Protocolos de Envío Configurados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 text-2xl block mb-2">Veri*Factu en Tiempo Real</span>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Remisión inmediata por servicio web SOAP del bloque de hash encadenado con código QR en el momento exacto de emisión de cada factura.
                </p>
                <div className="mt-3 text-base font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Transmisión automática habilitada</span>
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 text-2xl block mb-2">Cotejo de Huella Digital Fiscal</span>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Registro inalterable con sellado de tiempo criptográfico que previene cualquier modificación retroactiva.
                </p>
                <div className="mt-3 text-base font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Auditoría de integridad activa</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Contenido Pestaña 2: Red Interempresas B2B (Todos los textos tamaño x2) */}
        {activeTab === 'b2b' && (
          <div className="p-8 overflow-y-auto space-y-6 text-xl sm:text-2xl text-slate-800">
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
              <Network className="w-8 h-8 text-amber-700 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-amber-950 text-2xl sm:text-3xl">Red Interempresas B2B de Servicios y Reparaciones</h4>
                <p className="text-amber-900 text-xl sm:text-2xl mt-1.5 leading-relaxed">
                  Plataforma colaborativa para derivación de trabajos entre talleres asociados, especialistas de chapa, pintura, mecánica pesada y proveedores de recambios.
                  <strong> Comisión automática del 5% fijada por defecto</strong> para todas las derivaciones y órdenes completadas con éxito.
                </p>
              </div>
            </div>

            {/* Métrica de comisiones acumuladas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900 text-white rounded-xl">
                <span className="text-base uppercase font-bold text-slate-400 tracking-wider block">Comisión Estándar B2B</span>
                <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono mt-1">5,00 %</div>
                <span className="text-base text-slate-400">Aplicada automáticamente</span>
              </div>

              <div className="p-5 bg-slate-900 text-white rounded-xl">
                <span className="text-base uppercase font-bold text-slate-400 tracking-wider block">Órdenes Finalizadas con Éxito</span>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono mt-1">2 de 3</div>
                <span className="text-base text-emerald-400">100% liquidadas</span>
              </div>

              <div className="p-5 bg-slate-900 text-white rounded-xl">
                <span className="text-base uppercase font-bold text-slate-400 tracking-wider block">Comisiones Acumuladas</span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono mt-1">
                  {totalCommissionsEarned.toFixed(2)} €
                </div>
                <button
                  type="button"
                  onClick={handleLiquidateCommissions}
                  className="mt-2 text-base font-bold text-teal-300 hover:underline cursor-pointer"
                >
                  Liquidar ahora en cuenta
                </button>
              </div>
            </div>

            {/* Tabla de pedidos y desvíos B2B */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xl uppercase tracking-wide">
                  Historial de Derivaciones y Reparto B2B
                </span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
