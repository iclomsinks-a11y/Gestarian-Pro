import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Plus, Bell, Sparkles, ArrowRight, Palette } from 'lucide-react';
import { AppUser, GestarianDocument } from '../types';
import { CasioVintageClock } from './CasioVintageClock';

// Icono representativo de conversación bidireccional: ondas saliendo a izquierda y derecha desde un punto central
const BidirectionalWavesIcon: React.FC<{ className?: string }> = ({ 
  className = 'w-6 h-6 sm:w-7 sm:h-7', 
}) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Punto central */}
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    {/* Ondas interiores izquierda y derecha */}
    <path d="M8.5 8.5a5 5 0 0 0 0 7" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    {/* Ondas exteriores izquierda y derecha */}
    <path d="M5.5 5.5a9.5 9.5 0 0 0 0 13" />
    <path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" />
  </svg>
);

interface HomeViewProps {
  currentUser: AppUser;
  onOpenScanner: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onOpenMetisChat: () => void;
  onOpenVoiceAssistant: () => void;
  pendingBudgetReviews?: GestarianDocument[];
  onOpenBudgetReview?: (budgetId: string) => void;
  onOpenImageCustomizer?: () => void;
  onOpenClientLanding?: () => void;
  onOpenAccessSelector?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  onOpenScanner,
  onOpenMenu,
  onOpenNotifications,
  unreadNotificationsCount,
  onOpenMetisChat,
  onOpenVoiceAssistant,
  pendingBudgetReviews = [],
  onOpenBudgetReview,
  onOpenImageCustomizer,
  onOpenClientLanding,
  onOpenAccessSelector,
}) => {
  const isAutomocion =
    currentUser.sector?.toLowerCase().includes('automoci') ||
    currentUser.sector?.toLowerCase().includes('taller') ||
    currentUser.sector?.toLowerCase().includes('chapa') ||
    currentUser.fullName?.toLowerCase().includes('car');

  // Solo se muestra el botón de cambiar fondo si NO hay una imagen de fondo personalizada
  const hasCustomBg = Boolean(currentUser.bgPortraitUrl || currentUser.bgLandscapeUrl);

  return (
    <div
      className="relative w-screen h-[100dvh] max-h-[100dvh] bg-black overflow-hidden flex flex-col items-center justify-between snap-start shrink-0"
      id="page-inicio"
    >
      {/* Background Image - Sin capa de oscurecimiento */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fade-in-bg"
        style={{
          backgroundImage: `url(${
            window.innerHeight > window.innerWidth
              ? currentUser.bgPortraitUrl ||
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
              : currentUser.bgLandscapeUrl ||
                'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
          })`,
        }}
      />

      {/* Botones de acceso y personalización top left */}
      <div className="absolute top-3 left-3 z-50 flex items-center gap-2 stagger-left" style={{ animationDelay: "0.2s" }}>
        {onOpenAccessSelector && (
          <button
            onClick={onOpenAccessSelector}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A]/90 hover:bg-[#0F2942] text-white backdrop-blur-md rounded-xl border border-sky-400/40 text-xs font-bold shadow-lg transition-all cursor-pointer"
            title="Acceso Clientes y Usuarios"
          >
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse"></span>
            <span>Acceso Clientes / Autorizados / Taller</span>
          </button>
        )}

        {onOpenImageCustomizer && !hasCustomBg && (
          <button
            onClick={onOpenImageCustomizer}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0F2942]/90 hover:bg-[#1E3A8A] text-white backdrop-blur-md rounded-xl border border-blue-400/40 text-xs font-bold shadow-lg transition-all cursor-pointer"
            title="Personalizar fondo con IA (por defecto)"
          >
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Cambiar Fondo</span>
          </button>
        )}
      </div>

      {/* Barra superior para notificaciones de METIS */}
      <div className="absolute top-3 right-16 z-50 stagger-right" style={{ animationDelay: "0.4s" }}>
        {unreadNotificationsCount > 0 && (
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 bg-[#0F2942]/90 backdrop-blur-md rounded-full border border-rose-500/50 text-rose-400 hover:text-rose-300 hover:bg-[#1E3A8A] hover:scale-105 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
            title="Avisos de METIS pendientes"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full border-2 border-[#0F172A]">
              {unreadNotificationsCount}
            </span>
          </button>
        )}
      </div>
      
      {/* Header: Reloj Digital Casio Vintage centrado arriba a 10px del borde superior */}
      <div className="relative z-10 w-full pt-[10px] px-3 sm:px-6 stagger-top" style={{ animationDelay: "0.6s" }}>
        <CasioVintageClock 
          isLightBackground={false} 
          fiscalAddress={currentUser.fiscalAddress} 
        />
      </div>

      {/* Notificación de METIS en la pantalla de inicio si hay presupuestos pendientes de valorar precios por el jefe */}
      {pendingBudgetReviews.length > 0 && (
        <div className="relative z-20 w-full max-w-lg mx-auto px-4 my-auto space-y-3 stagger-left" style={{ animationDelay: "0.8s" }}>
          {pendingBudgetReviews.map((budget) => (
            <div
              key={budget.id}
              onClick={() => onOpenBudgetReview && onOpenBudgetReview(budget.id)}
              className="cursor-pointer bg-[#0F2942]/95 border-2 border-[#38BDF8] text-white p-4 rounded-xl shadow-[0_0_25px_rgba(56,189,248,0.55)] backdrop-blur-md flex items-center justify-between gap-3 hover:scale-[1.02] transition-transform animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0F2942] border-2 border-white flex items-center justify-center text-[#38BDF8] font-black text-xs shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.8)]">
                  AI
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Nuevo presupuesto de {budget.createdByName || 'operario'}, termina de cumplimentarlo</span>
                  </p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    {budget.vehiclePlate ? `Vehículo matrícula: ${budget.vehiclePlate}` : budget.number} · Toca para valorar precios
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider shrink-0 bg-[#38BDF8]/20 px-2.5 py-1.5 rounded-lg border border-[#38BDF8]/40">
                <span>Completar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Espacio libre intermedio cuando no hay alertas */}
      {pendingBudgetReviews.length === 0 && (
        <div className="relative z-10 flex-1 w-full" />
      )}

      {/* FOOTER: Botonera con aros de 1px sólido blanco con glow de color y dibujos en trazo blanco */}
      <div className="relative z-10 w-full pb-8 px-4 sm:px-8 flex justify-center items-center stagger-bottom" style={{ animationDelay: "1.0s" }}>
        <div className="flex items-center justify-between sm:justify-center gap-6 sm:gap-12 w-full max-w-xs sm:max-w-md mx-auto flex-nowrap">
          {/* 1. Icono Cámara (si automoción): ARO LÍNEA 1PX BLANCA, GLOW VERDE, DIBUJO EN LÍNEA BLANCA */}
          {isAutomocion && (
            <button
              onClick={onOpenScanner}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
              style={{
                border: '1px solid #ffffff',
                boxShadow: '0 0 10px #22c55e, 0 0 20px rgba(34, 197, 94, 0.45)',
              }}
              title="Escanear matrícula de vehículo con cámara OCR ALPR"
            >
              <Camera 
                strokeWidth={1.3} 
                className="w-6 h-6 sm:w-7 sm:h-7 text-white" 
              />
            </button>
          )}

          {/* 2. Icono Menú Bento (+): ARO LÍNEA 1PX BLANCA, GLOW TURQUESA, DIBUJO EN LÍNEA BLANCA */}
          <button
            onClick={onOpenMenu}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
            style={{
              border: '1px solid #ffffff',
              boxShadow: '0 0 10px #06b6d4, 0 0 20px rgba(6, 182, 212, 0.45)',
            }}
            title="Abrir menú Bento (+)"
          >
            <Plus 
              strokeWidth={1.4} 
              className="w-6 h-6 sm:w-7 sm:h-7 text-white" 
            />
          </button>

          {/* 3. Icono Metis AI: ARO LÍNEA 1PX BLANCA, GLOW NARANJA, TIPOGRAFÍA EN LÍNEA BLANCA */}
          <button
            onClick={onOpenMetisChat}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
            style={{
              border: '1px solid #ffffff',
              boxShadow: '0 0 10px #f97316, 0 0 20px rgba(249, 115, 22, 0.45)',
            }}
            title="Abrir chat de Metis: Asistente IA especialista en el taller"
          >
            <span className="font-normal tracking-tighter font-sans text-xl sm:text-2xl text-white leading-none select-none">
              AI
            </span>
          </button>

          {/* 4. Icono Conversación Bidireccional: ARO LÍNEA 1PX BLANCA, GLOW MORADO, DIBUJO EN LÍNEA BLANCA */}
          <button
            onClick={onOpenVoiceAssistant}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
            style={{
              border: '1px solid #ffffff',
              boxShadow: '0 0 10px #a855f7, 0 0 20px rgba(168, 85, 247, 0.45)',
            }}
            title="Conversación bidireccional con Metis (Manos Libres sin chat escrito)"
          >
            <BidirectionalWavesIcon 
              className="w-6 h-6 sm:w-7 sm:h-7 text-white" 
            />
          </button>
        </div>
      </div>
    </div>
  );
};
