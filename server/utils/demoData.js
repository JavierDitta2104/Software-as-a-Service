const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const Activity = require('../models/Activity');

const generateDemoData = async (userId) => {
    try {
        // 1. Create Welcome Board
        const board = new Board({
            title: '🚀 Mi Primer Proyecto',
            description: 'Bienvenido a AgilFlow. Este es un tablero de ejemplo para que explores las funcionalidades.',
            owner: userId
        });
        await board.save();

        // 2. Create Lists
        const listData = [
            { title: '📝 Por hacer', order: 1 },
            { title: '🕒 En proceso', order: 2 },
            { title: '✅ Hecho', order: 3 }
        ];

        const lists = [];
        for (const item of listData) {
            const list = new List({
                title: item.title,
                boardId: board._id,
                order: item.order
            });
            await list.save();
            lists.push(list);
        }

        // 3. Create Cards (Tasks)
        const now = new Date();
        const cardData = [
            { title: 'Explorar AgilFlow', description: 'Revisa todas las secciones de la aplicación.', priority: 'low', listIndex: 0, tags: [{ name: 'Onboarding', color: '#3b82f6' }], dueDate: new Date(now.getTime() - 86400000 * 2) },
            { title: 'Crear mi primer tablero', description: 'Usa el botón "+" para empezar un proyecto real.', priority: 'medium', listIndex: 0, tags: [{ name: 'Proyecto', color: '#10b981' }], dueDate: new Date(now.getTime() + 86400000 * 5) },
            { title: 'Configurar perfil', description: 'Añade tu nombre y foto.', priority: 'low', listIndex: 1, tags: [{ name: 'UI', color: '#a855f7' }] },
            { title: 'Completar tutorial', description: '¡Ya casi terminas!', priority: 'high', listIndex: 1, tags: [{ name: 'Urgente', color: '#ef4444' }], dueDate: new Date(now.getTime() + 86400000) },
            { title: 'Registro exitoso', description: 'Ya tienes tu cuenta activa.', priority: 'low', listIndex: 2 }
        ];

        for (const item of cardData) {
            const card = new Card({
                title: item.title,
                description: item.description,
                priority: item.priority,
                listId: lists[item.listIndex]._id,
                order: 0,
                tags: item.tags || [],
                dueDate: item.dueDate || null
            });
            await card.save();
        }

        // 4. Initial Activity Log
        await Activity.create({
            userId,
            boardId: board._id,
            action: 'creó el proyecto',
            targetName: '🚀 Mi Primer Proyecto'
        });

        console.log(`Demo data created for user: ${userId}`);
    } catch (err) {
        console.error('Error generating demo data:', err);
    }
};

module.exports = { generateDemoData };
