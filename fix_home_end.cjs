const fs = require('fs');

let content = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

// The bottom part starts from: {/* FOOTER: Botonera en secuencia exacta solicitada */}
const footerStart = content.indexOf('{/* FOOTER: Botonera en secuencia exacta solicitada */}');
if (footerStart !== -1) {
  content = content.substring(0, footerStart) + `{/* FOOTER: Botonera en secuencia exacta solicitada */}
      <div className="relative z-10 w-full pb-8 px-6 sm:px-12 flex flex-wrap justify-center items-center gap-4">
        {/* Grupo Principal Izquierda / Central */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* 1. Icono de cámara en el footer a la izquierda (solo si pertenece a automoción/taller) */}
          {isAutomocion && (
            <button
              onClick={onOpenScanner}
              className="p-3.5 sm:p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
              title="Escanear matrícula de vehículo con cámara OCR ALPR"
            >
              <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* 2. A su derecha: Icono de menú que al pulsarlo aparecen todas las páginas */}
          <button
            onClick={onOpenMenu}
            className="p-3.5 sm:p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
            title="Abrir menú de navegación general"
          >
            <Menu className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>

          {/* 3. A la derecha del icono de menú: Icono de Metis (redondo con AI dentro, con glow celeste y línea blanca) */}
          <button
            onClick={onOpenMetisChat}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0F2942] border-2 border-white text-[#38BDF8] font-black text-lg flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.7)] hover:shadow-[0_0_28px_rgba(56,189,248,0.95)] hover:scale-105 transition-all"
            title="Abrir chat de Metis: Asistente IA especialista en el taller"
          >
            <span className="tracking-tighter">AI</span>
          </button>

          {/* 4. A la derecha del icono de Metis: Icono de conversación bidireccional (manos libres) */}
          <button
            onClick={onOpenVoiceAssistant}
            className="p-3.5 sm:p-4 bg-gradient-to-tr from-[#0F2942]/80 to-[#1E3A8A]/80 backdrop-blur-md rounded-full border border-[#38BDF8]/60 text-[#38BDF8] hover:text-white hover:bg-[#1E3A8A] hover:scale-105 transition-all shadow-[0_0_15px_rgba(56,189,248,0.4)]"
            title="Conversación bidireccional con Metis (Manos Libres sin chat escrito)"
          >
            <Waves className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};
`;
  fs.writeFileSync('src/components/HomeView.tsx', content);
}
