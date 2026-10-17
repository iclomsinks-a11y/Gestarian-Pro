import React, { useState, useEffect } from 'react';
import { 
  X, Download, Smartphone, Monitor, Apple, Chrome, 
  CheckCircle2, ArrowRight, Sparkles, Share2, PlusSquare
} from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
}) => {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Auto-detectar dispositivo
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        setPlatform('ios');
      } else if (/android/i.test(userAgent)) {
        setPlatform('android');
      } else {
        setPlatform('desktop');
      }

      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setIsInstalling(false);
    } else {
      // Si no hay prompt nativo disponible, descargar acceso directo o mostrar instrucciones
      const manifestUrl = '/manifest.json';
      const a = document.createElement('a');
      a.href = manifestUrl;
      a.download = 'gestarian-app.webmanifest';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#0B101B] border border-slate-700/80 rounded-3xl p-5 sm:p-7 text-white shadow-2xl my-auto animate-in zoom-in-95 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Download className="w-3.5 h-3.5" />
              <span>Aplicación Oficial GESTARIAN PWA</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              Descarga e Instalación de la App
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
              Instala GESTARIAN en tu móvil o PC para trabajar a pantalla completa, con acceso instantáneo y soporte offline.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botón de Instalación Automática (1 clic) si soportado */}
        {deferredPrompt && !isInstalled && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 to-indigo-950/80 border border-sky-400/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">¡Tu navegador está listo para instalar!</p>
              <p className="text-xs text-sky-200 font-light">Pulsa el botón para añadir el icono de Gestarian a tu pantalla de inicio.</p>
            </div>
            <button
              onClick={handleInstallPwa}
              disabled={isInstalling}
              className="px-4 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-sky-400/20"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalling ? 'Instalando...' : 'Instalar Ahora'}</span>
            </button>
          </div>
        )}

        {isInstalled && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>¡GESTARIAN ya está instalado en este dispositivo como aplicación nativa!</span>
          </div>
        )}

        {/* Selector de Plataforma */}
        <div className="flex items-center gap-2 mt-5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setPlatform('android')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              platform === 'android' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setPlatform('ios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              platform === 'ios' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS (iPhone / iPad)</span>
          </button>
          <button
            onClick={() => setPlatform('desktop')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              platform === 'desktop' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Windows / Mac</span>
          </button>
        </div>

        {/* Guías Paso a Paso según la plataforma */}
        <div className="mt-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          {platform === 'android' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Chrome className="w-4 h-4 text-emerald-400" />
                <span>Instalación en dispositivos Android (Chrome / Edge)</span>
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-300 font-light">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">1</span>
                  <span>Abre esta web en Google Chrome en tu smartphone Android.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">2</span>
                  <span>Toca el menú de tres puntos verticales (⋮) en la esquina superior derecha.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">3</span>
                  <span>Selecciona la opción <strong>«Instalar aplicación»</strong> o <strong>«Añadir a pantalla de inicio»</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">4</span>
                  <span>Confirma pulsando «Instalar». El icono de GESTARIAN aparecerá entre tus apps con arranque instantáneo sin marcos de navegador.</span>
                </li>
              </ol>
            </div>
          )}

          {platform === 'ios' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Apple className="w-4 h-4 text-slate-200" />
                <span>Instalación en iPhone / iPad (Safari)</span>
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-300 font-light">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">1</span>
                  <span>Abre esta página web en el navegador Safari oficial de tu iPhone o iPad.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">2</span>
                  <span>Toca el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> (cuadrado con flecha hacia arriba en la barra inferior).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">3</span>
                  <span>Desplázate hacia abajo en la lista y pulsa <strong>«Añadir a la pantalla de inicio»</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">4</span>
                  <span>Pulsa «Añadir» en la esquina superior derecha. Se creará el acceso directo nativo como una app independiente de iOS.</span>
                </li>
              </ol>
            </div>
          )}

          {platform === 'desktop' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-sky-400" />
                <span>Instalación en PC / Mac (Chrome, Edge o Brave)</span>
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-300 font-light">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">1</span>
                  <span>En tu navegador de escritorio, localiza el icono de instalación <Download className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> en la parte derecha de la barra de direcciones URL.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">2</span>
                  <span>O haz clic en el menú (tres puntos) y elige <strong>«Instalar GESTARIAN...»</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400 font-bold shrink-0">3</span>
                  <span>Haz clic en «Instalar». La app se abrirá en una ventana dedicada de alta velocidad y se anclará a tu barra de tareas o dock.</span>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-light">PWA v2.4 · Conforme AEAT Veri*Factu</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
