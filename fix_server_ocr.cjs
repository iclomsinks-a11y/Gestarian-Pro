const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const importStatement = "import { GoogleGenAI } from '@google/genai';\n";
content = content.replace("import express from 'express';", importStatement + "import express from 'express';");

const newEndpoint = `
  // Proxy seguro para Gemini OCR (Facturas Recibidas)
  app.post('/api/scan-receipt', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { image } = req.body; // base64 image

      if (!image) {
        return res.status(400).json({ success: false, error: 'No se ha proporcionado ninguna imagen.' });
      }

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(400).json({ success: false, error: 'GEMINI_API_KEY no configurada.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

      const text = response.text || '';
      const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, data });
      } else {
        return res.status(400).json({ success: false, error: 'No se pudo extraer la información.', raw: text });
      }

    } catch (err: any) {
      console.error('Error en /api/scan-receipt:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
`;

// Insert before Vite middleware
content = content.replace("  // Integración de Vite Middleware", newEndpoint + "\n  // Integración de Vite Middleware");

fs.writeFileSync('server.ts', content);
