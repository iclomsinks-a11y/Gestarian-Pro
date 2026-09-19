const fs = require('fs');
let file = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

// We need to add Bell to lucide-react imports
file = file.replace("import { Camera, Menu } from 'lucide-react';", "import { Camera, Menu, Bell } from 'lucide-react';");

// Add onOpenNotifications to props
file = file.replace(
  "interface HomeViewProps {\n  currentUser: AppUser;\n  onOpenScanner: () => void;\n  onOpenMenu: () => void;\n}",
  "interface HomeViewProps {\n  currentUser: AppUser;\n  onOpenScanner: () => void;\n  onOpenMenu: () => void;\n  onOpenNotifications: () => void;\n  unreadNotificationsCount: number;\n}"
);

file = file.replace(
  "export const HomeView: React.FC<HomeViewProps> = ({ currentUser, onOpenScanner, onOpenMenu }) => {",
  "export const HomeView: React.FC<HomeViewProps> = ({ currentUser, onOpenScanner, onOpenMenu, onOpenNotifications, unreadNotificationsCount }) => {"
);

// Add the bell icon next to the Menu in the footer
const oldFooter = `        <button 
          onClick={onOpenMenu}
          className="p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
        >
          <Menu className="w-8 h-8" />
        </button>
      </div>`;

const newFooter = `        <div className="flex gap-4">
          <button 
            onClick={onOpenNotifications}
            className="relative p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
          >
            <Bell className="w-8 h-8" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-[#0F172A]">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button 
            onClick={onOpenMenu}
            className="p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
          >
            <Menu className="w-8 h-8" />
          </button>
        </div>
      </div>`;

file = file.replace(oldFooter, newFooter);
fs.writeFileSync('src/components/HomeView.tsx', file);
