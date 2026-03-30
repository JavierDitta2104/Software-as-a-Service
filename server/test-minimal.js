const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
  console.log("Using Key Prefix:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) : "MISSING");
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro", apiVersion: "v1beta" });
    const result = await model.generateContent("Hola, responde con la palabra 'OK'");
    console.log(result.response.text());
  } catch (e) {
    console.error(e);
  }
}

run();
