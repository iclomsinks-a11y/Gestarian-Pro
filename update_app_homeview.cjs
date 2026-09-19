const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

const oldHomeView = `        <HomeView 
          currentUser={user} 
          onOpenScanner={() => setIsPlateScannerOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
        />`;

const newHomeView = `        <HomeView 
          currentUser={user} 
          onOpenScanner={() => setIsPlateScannerOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        />`;

file = file.replace(oldHomeView, newHomeView);
fs.writeFileSync('src/App.tsx', file);
