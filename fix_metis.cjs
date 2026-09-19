const fs = require('fs');

let content = fs.readFileSync('src/components/MetisChatModal.tsx', 'utf8');

const effectCode = `  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      // Simular la lógica de avisos trimestrales
      if (currentUser.agencyEmail) {
        const checkQuarterlyAlerts = () => {
          const today = new Date();
          // Simulación estática para la demo (como si estuviéramos a día 20 de septiembre, a 10 días del cierre 30 de septiembre)
          // El 17 de septiembre ya está a 13 días.
          const msg1 = "🚨 **Cierre Trimestral Próximo:** Quedan pocos días para el cierre trimestral. Por favor, asegúrate de incorporar todas las facturas de gastos pendientes.";
          const msg2 = "📩 **Aviso de Envío Automático:** Mañana a las 10:00 se enviará el informe trimestral a la gestoría (" + currentUser.agencyEmail + "). Las facturas no incorporadas podrás incluirlas en el siguiente trimestre de acuerdo con la legislación vigente.";
          
          setMessages(prev => {
            const hasAlert = prev.some(m => m.id === 'q-alert');
            if (!hasAlert) {
              return [
                ...prev,
                {
                  id: 'q-alert',
                  role: 'assistant',
                  content: msg1,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
                {
                  id: 'q-alert-2',
                  role: 'assistant',
                  content: msg2,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }
              ];
            }
            return prev;
          });
        };
        checkQuarterlyAlerts();
      }
    }
  }, [messages, isOpen, currentUser.agencyEmail]);`;

content = content.replace(/  useEffect\(\(\) => \{\n    if \(isOpen\) \{\n      messagesEndRef.current\?\.scrollIntoView\(\{ behavior: 'smooth' \}\);\n    \}\n  \}, \[messages, isOpen\]\);/, effectCode);

fs.writeFileSync('src/components/MetisChatModal.tsx', content);
