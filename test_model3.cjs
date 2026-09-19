const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const models = ['gemini-pro-latest', 'gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: 'hello'
      });
      console.log(model, "OK");
    } catch (e) {
      console.log(model, "ERROR", e.message);
    }
  }
}
run();
