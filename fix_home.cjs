const fs = require('fs');

let content = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

// 1. Remove the entire top bar containing Logo, Clientes, and Personalizar Fondos IA
// The block starts at: {/* Barra superior con Logo arriba a la izquierda
// and ends after the Clientes / Personalizar Fondos div

const topBarRegex = /\{\/\* Barra superior con Logo arriba a la izquierda.*?\n      <\/div>/s;
// Let's be careful. Let's find exactly the div to replace.

content = content.replace(
  /\{\/\* Barra superior con Logo arriba a la izquierda.*?<div className="relative z-10 w-full pt-3 sm:pt-4 px-4 sm:px-8">/s,
  `{/* Barra superior para notificaciones de METIS */}
      <div className="absolute top-4 right-4 z-50">
        {unreadNotificationsCount > 0 && (
          <button
            onClick={onOpenNotifications}
            className="relative p-3 bg-[#0F2942]/90 backdrop-blur-md rounded-full border border-rose-500/50 text-rose-400 hover:text-rose-300 hover:bg-[#1E3A8A] hover:scale-105 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
            title="Avisos de METIS pendientes"
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-[#0F172A]">
              {unreadNotificationsCount}
            </span>
          </button>
        )}
      </div>
      
      {/* Header: Reloj Digital Casio Vintage */}
      <div className="relative z-10 w-full pt-16 sm:pt-20 px-4 sm:px-8">`
);

// 2. Remove the Notifications icon from the bottom right (since it moved to top right)
const bottomNotificationsRegex = /\{\/\* Notificaciones Internas de Taller a la derecha \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/s;
content = content.replace(
  bottomNotificationsRegex,
  `</div>\n      </div>\n    </div>`
);

fs.writeFileSync('src/components/HomeView.tsx', content);
