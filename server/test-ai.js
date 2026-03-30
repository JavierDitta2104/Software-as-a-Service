const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { parseTaskNLP } = require('./src/services/ai/nlpService');

async function testAI() {
    console.log("Key Prefix:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) : "NOT FOUND");
    console.log("--- Probando AgilFlow AI ---");
    const texto = "Crear un informe de ventas urgente para mañana";
    console.log(`Texto a procesar: "${texto}"`);
    
    try {
        const result = await parseTaskNLP(texto);
        console.log("\nResultado de la IA:");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("\nError al probar la IA:", error.message);
    }
}

testAI();
