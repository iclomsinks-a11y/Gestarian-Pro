import React, { useState } from 'react';
import { 
  Smartphone, 
  Car, 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  AlertCircle, 
  Wrench,
  FileText,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { AppUser, Client, GestarianDocument } from '../types';

interface ClientPortalLoginViewProps {
  workshopUser: AppUser;
  clients: Client[];
  documents: GestarianDocument[];
  onClientLogin: (client: Client) => void;
}

export const ClientPortalLoginView: React.FC<ClientPortalLoginViewProps> = ({
  workshopUser,
  clients,
  documents,
  onClientLogin,
}) => {
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState(''); // DNI, CIF o Matrícula
  const [error, setError] = useState('');
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  // Clientes de muestra para acceso rápido con 1 clic
  const sampleClients: Client[] = clients.length > 0 
    ? clients.slice(0, 4) 
    : [
        {
          id: 'cli_demo_1',
          clientNumber: 1,
          name: 'Carlos Ruiz García',
          cif: '12345678Z',
          email: 'carlos.ruiz@gmail.com',
          phone: '654987321',
          address: 'Calle Mayor 12, Madrid',
          plates: ['4582KMB'],
          vehicles: [{ plate: '4582KMB', brand: 'Volkswagen', model: 'Golf VII' }],
          clientType: 'particular',
        },
        {
          id: 'cli_demo_2',
          clientNumber: 2,
          name: 'Transportes Rápidos SL',
          cif: 'B98765432',
          email: 'logistica@transportesrapidos.com',
          phone: '912345678',
          address: 'Polígono Industrial Las Mercedes 4',
          plates: ['7891LKP', '1245JHG'],
          vehicles: [{ plate: '7891LKP', brand: 'Mercedes-Benz', model: 'Sprinter' }],
          clientType: 'empresa',
        }
      ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowGuestPrompt(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanId = identifier.trim().toUpperCase().replace(/[\s-]/g, '');

    if (!cleanEmail && !cleanId) {
      setError('Por favor, introduce tu Email o tu DNI/CIF/Matrícula para acceder.');
      return;
    }

    // 1. Buscar en cartera de clientes
    const matchedClient = clients.find((c) => {
      const matchEmail = cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail;
      const matchCif = cleanId && c.cif && c.cif.trim().toUpperCase().replace(/[\s-]/g, '') === cleanId;
      const matchPlate = cleanId && (
        c.plates?.some((p) => p.trim().toUpperCase().replace(/[\s-]/g, '') === cleanId) ||
        c.vehicles?.some((v) => v.plate.trim().toUpperCase().replace(/[\s-]/g, '') === cleanId)
      );

      // Si introdujo ambos, verificar concordancia o match
      if (cleanEmail && cleanId) {
        return (matchEmail && (matchCif || matchPlate)) || matchEmail || matchCif || matchPlate;
      }
      return matchEmail || matchCif || matchPlate;
    });

    if (matchedClient) {
      onClientLogin(matchedClient);
      return;
    }

    // 2. Buscar en expedientes y documentos existentes
    const matchedDoc = documents.find((d) => {
      const docEmail = d.clientEmail?.trim().toLowerCase();
      const docCif = d.clientCif?.trim().toUpperCase().replace(/[\s-]/g, '');
      const docPlate = d.vehiclePlate?.trim().toUpperCase().replace(/[\s-]/g, '');

      return (
        (cleanEmail && docEmail === cleanEmail) ||
        (cleanId && (docCif === cleanId || docPlate === cleanId))
      );
    });

    if (matchedDoc) {
      const clientFromDoc: Client = {
        id: matchedDoc.clientId || `cli_${Date.now()}`,
        clientNumber: 1,
        name: matchedDoc.clientName || 'Cliente Particular',
        cif: matchedDoc.clientCif || cleanId,
        email: matchedDoc.clientEmail || cleanEmail,
        phone: matchedDoc.clientPhone || '',
        address: matchedDoc.clientAddress || '',
        plates: matchedDoc.vehiclePlate ? [matchedDoc.vehiclePlate] : (cleanId.length <= 8 ? [cleanId] : []),
        vehicles: matchedDoc.vehiclePlate ? [{ plate: matchedDoc.vehiclePlate, brand: matchedDoc.vehicleBrand, model: matchedDoc.vehicleModel }] : [],
        clientType: 'particular',
      };
      onClientLogin(clientFromDoc);
      return;
    }

    // 3. No encontrado: dar opción de entrar como nuevo cliente
    setError('No encontramos ningún expediente asociado a estos datos.');
    setShowGuestPrompt(true);
  };

  const handleEnterAsGuest = () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanId = identifier.trim().toUpperCase();
    const isPlate = cleanId.length <= 8 && /^[0-9A-Z]+$/.test(cleanId.replace(/[\s-]/g, ''));

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      clientNumber: clients.length + 1,
      name: cleanEmail ? cleanEmail.split('@')[0].toUpperCase() : (isPlate ? `Cliente ${cleanId}` : 'Cliente Particular'),
      email: cleanEmail,
      cif: !isPlate ? cleanId : '',
      phone: '',
      address: '',
      plates: isPlate ? [cleanId] : [],
      vehicles: isPlate ? [{ plate: cleanId, brand: '', model: '' }] : [],
      clientType: 'particular',
    };

    onClientLogin(newClient);
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#090D16] text-[#F8FAFC] flex flex-col justify-between overflow-x-hidden selection:bg-[#38BDF8] selection:text-[#090D16]">
      {/* Fondo con imagen del taller o gradiente tecnológico */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 filter blur-[1px]"
        style={{
          backgroundImage: `url(${
            workshopUser.bgLandscapeUrl || 
            workshopUser.bgPortraitUrl || 
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
          })`,
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#090D16]/80 via-[#0B132B]/90 to-[#090D16]" />

      {/* Barra Superior Branding Taller */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {workshopUser.logoUrl ? (
            <img 
              src={workshopUser.logoUrl} 
              alt={workshopUser.fullName} 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl border border-white/20 bg-white/5 p-1 shadow-md"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#0F2942] border border-cyan-400/30 flex items-center justify-center text-white font-black text-lg shadow-[0_0_20px_rgba(56,189,248,0.25)]">
              <Wrench className="w-5 h-5 text-[#38BDF8]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#38BDF8] bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Portal Oficial del Cliente
              </span>
              <span className="hidden sm:inline text-xs text-slate-400">·</span>
              <span className="hidden sm:inline text-xs text-slate-300 font-medium">Gestarian Connected</span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
              {workshopUser.fullName || 'Taller de Automoción'}
            </h1>
          </div>
        </div>

        {/* Acceso Taller Profesional */}
        <a 
          href="https://pro-gestarian.web.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Acceso exclusivo para administradores y empleados del taller"
        >
          <span className="hidden md:inline">Acceso Taller</span>
          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
        </a>
      </header>

      {/* Contenido Central: Tarjeta de Acceso al Portal */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Columna Izquierda: Presentación y Beneficios del Portal */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conexión Directa con tu Taller</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Tu vehículo, bajo control en <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">tiempo real</span>.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
              Consulta en cualquier momento el estado de la reparación de tu vehículo, revisa presupuestos y facturas, acepta fechas de entrega y solicita nuevos presupuestos online.
            </p>

            {/* Micro-tarjetas de características */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-[#38BDF8] flex items-center justify-center mb-2">
                  <Car className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Mis Expedientes</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Seguimiento de orden y fotos de daños.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Presupuestos y Pagos</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Aceptación online y facturas PDF.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Solicitudes Online</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Pide presupuesto subiendo tus fotos.</p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Acceso con Email y DNI / Matrícula */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="relative p-6 sm:p-8 rounded-2xl bg-[#0F172A]/90 backdrop-blur-xl border border-white/15 shadow-[0_0_50px_rgba(56,189,248,0.12)]">
              {/* Resplandor decorativo */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#0284C7] flex items-center justify-center text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Acceso al Área de Cliente
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Introduce tus datos para acceder a tu expediente
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div className="flex-1">
                      <p className="font-semibold">{error}</p>
                      {showGuestPrompt && (
                        <button
                          type="button"
                          onClick={handleEnterAsGuest}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Entrar como Nuevo Cliente</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu-email@ejemplo.com"
                        className="w-full pl-10 pr-3.5 py-3 bg-white/5 border border-white/15 focus:border-cyan-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* DNI / CIF o Matrícula */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      DNI / CIF o Matrícula
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Car className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Ej: 12345678Z o 1234BBB"
                        className="w-full pl-10 pr-3.5 py-3 bg-white/5 border border-white/15 focus:border-cyan-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all uppercase font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] hover:from-[#0369A1] hover:to-[#0284C7] text-white font-bold rounded-xl shadow-[0_0_25px_rgba(14,165,233,0.35)] hover:shadow-[0_0_35px_rgba(14,165,233,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer group text-sm uppercase tracking-wider"
                  >
                    <span>Entrar a mi Área</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                {/* Acceso Rápido Demo / Pruebas */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Acceso Rápido de Prueba (1 Clic)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {sampleClients.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => onClientLogin(sample)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                            {sample.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {sample.plates?.[0] ? `Vehículo: ${sample.plates[0]}` : sample.cif} · {sample.email || 'Cliente Registrado'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Pie de Página */}
      <footer className="relative z-10 w-full px-4 py-4 text-center border-t border-white/10 text-xs text-slate-500 backdrop-blur-md bg-white/[0.01]">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>GESTARIAN CLIENTES · Portal de Comunicación y Seguimiento Automotriz</span>
          <span className="hidden sm:inline">·</span>
          <span>Conectado con {workshopUser.fullName || 'Taller'}</span>
        </div>
      </footer>
    </div>
  );
};
