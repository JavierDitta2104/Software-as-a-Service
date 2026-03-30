const express = require('express');
const router = express.Router();
const { parseTaskNLP } = require('../src/services/ai/nlpService');
// Asumiendo que usas tu middleware de autenticación (auth) más adelante,
// si las notas y tareas requieren usuario, por ahora lo dejamos simple.

// POST /api/ai/parse-task
router.post('/parse-task', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Se requiere el texto para procesar' });
        }

        const taskData = await parseTaskNLP(text);
        res.json(taskData);
    } catch (error) {
        console.error('Error en /api/ai/parse-task:', error.message);
        res.status(500).json({ message: 'Hubo un error al procesar el texto con IA' });
    }
});

module.exports = router;
