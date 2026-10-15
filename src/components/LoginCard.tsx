import React, { useState, useEffect } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2, 
  KeyRound, AlertCircle, RefreshCw 
} from 'lucide-react';
import { AppUser } from '../types';

interface LoginCardProps {
  currentUser: AppUser;
  onLoginSuccess: (email: string) => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  currentUser,
  onLoginSuccess,
}) => {
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedPass = localStorage.getItem('gestarian_auth_password');
      const storedEmail = localStorage.getItem('gestarian_auth_email');
      
      if (storedPass && storedPass.trim().length > 0) {
        setIsFirstTime(false);
      } else {
        setIsFirstTime(true);
      }

      if (storedEmail) {
        setEmail(storedEmail);
      } else if (currentUser.email) {
        setEmail(currentUser.email);
      }
    } catch {
      setIsFirstTime(true);
    }
  }, [currentUser.email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setError('Por favor, introduce un correo electrónico válido.');
      return;
    }

    if (cleanPass.length < 3) {
      setError('La contraseña debe tener al menos 3 caracteres.');
      return;
    }

    if (isFirstTime) {
      if (cleanPass !== confirmPassword.trim()) {
        setError('Las contraseñas no coinciden. Por favor, verifícalas.');
        return;
      }

      // Guardar por primera vez
      try {
        localStorage.setItem('gestarian_auth_password', cleanPass);
        localStorage.setItem('gestarian_auth_email', cleanEmail);
        localStorage.setItem('gestarian_auth_session', 'true');
      } catch (err) {
        console.error('Error al guardar credenciales:', err);
      }

      setIsSuccess(true);
      setTimeout(() => {
        onLoginSuccess(cleanEmail);
      }, 700);
    } else {
      // Comprobar contraseña almacenada
      const storedPass = localStorage.getItem('gestarian_auth_password') || '';
      
      if (cleanPass !== storedPass) {
        setError('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
        return;
      }

      try {
        localStorage.setItem('gestarian_auth_session', 'true');
        localStorage.setItem('gestarian_auth_email', cleanEmail);
      } catch (err) {
        console.error('Error al guardar sesión:', err);
      }

      setIsSuccess(true);
      setTimeout(() => {
        onLoginSuccess(cleanEmail);
      }, 600);
    }
  };

  const handleResetPassword = () => {
    try {
      localStorage.removeItem('gestarian_auth_password');
      localStorage.removeItem('gestarian_auth_session');
      setIsFirstTime(true);
      setPassword('');
      setConfirmPassword('');
      setShowResetConfirm(false);
      setError(null);
    } catch (err) {
      console.error('Error al restablecer contraseña:', err);
    }
  };

  return (
    <div className="w-full bg-[#1E293B]/90 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(15,23,42,0.85)] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden transition-all duration-300">
      {/* Detalle visual de brillo superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-80" />

      {/* Cabecera de la tarjeta */}
      <div className="flex flex-col items-center text-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#0F2942] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.35)]">
          {isSuccess ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-bounce" />
          ) : isFirstTime ? (
            <KeyRound className="w-7 h-7 text-[#38BDF8]" />
          ) : (
            <Lock className="w-7 h-7 text-[#38BDF8]" />
          )}
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Acceso al Sistema
            </h2>
            {isFirstTime && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 rounded-full">
                Primera vez
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {isSuccess ? (
              <span className="text-emerald-400 font-semibold">Credenciales verificadas. Entrando...</span>
            ) : isFirstTime ? (
              'Establece tu contraseña de acceso para proteger el panel de gestión del taller.'
            ) : (
              'Introduce tu email y contraseña para acceder a Gestarian.'
            )}
          </p>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Confirmación para restablecer */}
      {showResetConfirm ? (
        <div className="space-y-4 p-4 rounded-xl bg-[#0F172A]/80 border border-amber-500/30 text-center">
          <p className="text-xs text-slate-300">
            ¿Deseas restablecer la contraseña de acceso? Podrás definir una nueva clave de inmediato.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              Confirmar y restablecer
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Email */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Correo Electrónico
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@taller.com"
                className="w-full bg-[#0F172A] border border-white/15 focus:border-[#38BDF8] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-colors placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {isFirstTime ? 'Crea tu Contraseña' : 'Contraseña'}
              </label>
              {!isFirstTime && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-[11px] text-[#38BDF8] hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu clave?
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isFirstTime ? 'Mínimo 3 caracteres' : '••••••••'}
                className="w-full bg-[#0F172A] border border-white/15 focus:border-[#38BDF8] text-white text-sm rounded-xl pl-10 pr-11 py-2.5 outline-none transition-colors placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña (solo la primera vez) */}
          {isFirstTime && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Confirmar Contraseña
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                  <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  className="w-full bg-[#0F172A] border border-white/15 focus:border-[#38BDF8] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-colors placeholder:text-slate-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                * Esta contraseña quedará guardada como tu clave de acceso.
              </p>
            </div>
          )}

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isSuccess}
            className={`w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              isSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#38BDF8] hover:to-[#0284C7] text-white hover:scale-[1.02] shadow-[0_0_20px_rgba(56,189,248,0.3)]'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Acceso Permitido</span>
              </>
            ) : isFirstTime ? (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Guardar Contraseña y Acceder</span>
              </>
            ) : (
              <>
                <span>Acceder al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
