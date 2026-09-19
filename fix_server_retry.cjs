const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldHandler = `
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
              { text: \`Extract the following information from this receipt/invoice. Respond ONLY with a valid JSON object matching this schema:
              {
                "issuerName": "string",
                "issuerCif": "string",
                "issuerAddress": "string",
                "baseAmount": number,
                "ivaAmount": number,
                "totalAmount": number
              }\`}
            ]
          }
        ]
      });`;

const newHandler = `
      const maxRetries = 3;
      let response;
      for (let i = 0; i < maxRetries; i++) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
                  { text: \`Extract the following information from this receipt/invoice. Respond ONLY with a valid JSON object matching this schema:
                  {
                    "issuerName": "string",
                    "issuerCif": "string",
                    "issuerAddress": "string",
                    "baseAmount": number,
                    "ivaAmount": number,
                    "totalAmount": number
                  }\`}
                ]
              }
            ]
          });
          break; // success
        } catch (err: any) {
          if (err.message && err.message.includes('503') && i < maxRetries - 1) {
            console.warn(\`Gemini API 503 error, retrying (\${i + 1}/\${maxRetries})...\`);
            await new Promise(res => setTimeout(res, 2000 * (i + 1))); // simple backoff
          } else {
            throw err;
          }
        }
      }
      
      if (!response) {
        throw new Error('No se pudo obtener respuesta del modelo después de varios intentos.');
      }
`;

content = content.replace(oldHandler, newHandler);

// Add better error reporting for 503
const catchBlockOld = `    } catch (err: any) {
      console.error('Error en /api/scan-receipt:', err);
      return res.status(500).json({ success: false, error: err.message });
    }`;

const catchBlockNew = `    } catch (err: any) {
      console.error('Error en /api/scan-receipt:', err);
      let errorMsg = err.message;
      if (errorMsg.includes('503')) {
         errorMsg = 'El servicio de IA está experimentando alta demanda en este momento. Por favor, inténtalo de nuevo en unos segundos.';
      }
      return res.status(500).json({ success: false, error: errorMsg });
    }`;

content = content.replace(catchBlockOld, catchBlockNew);

fs.writeFileSync('server.ts', content);
