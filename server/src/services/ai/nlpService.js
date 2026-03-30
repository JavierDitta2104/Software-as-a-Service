const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../../.env') });

let genAI;
const getGenAI = () => {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY no está configurada en el archivo .env");
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
};

const parseTaskNLP = async (text) => {
    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
Eres un asistente experto en gestión de proyectos. Analiza el siguiente texto proporcionado por el usuario y extrae la información para crear una tarea en un Tablero Kanban.
Devuelve ÚNICAMENTE un objeto JSON válido con las siguientes claves:
- "title": El título o nombre resumido de la tarea.
- "priority": La prioridad inferida de la tarea ("low", "medium", "high"). Usa "high" si mencionan urgencia, aso asap, hoy, urgente, etc. Usa "medium" por defecto.
- "dueDate": Una fecha estimada en formato ISO 8601 (YYYY-MM-DD) si el usuario lo menciona ("para mañana", "el viernes", etc.). Si no hay contexto de tiempo, pon "null". La fecha de hoy es: ${new Date().toISOString().split('T')[0]}.
- "description": Una descripción breve basada en el texto (opcional).

Texto del usuario: "${text}"
JSON:
`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        // Limpiamos la posible envoltura de markdown de código (```json ... ```)
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(responseText);
    } catch (error) {
        console.error("Error en parseTaskNLP:", error);
        throw new Error("No se pudo analizar el texto");
    }
};

module.exports = {
    parseTaskNLP
};
