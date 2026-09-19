const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-pro',
      contents: 'hello'
    });
    console.log("3.6-pro OK", response.text);
  } catch (e) {
    console.log("3.6-pro ERROR", e.message);
  }
}
run();
