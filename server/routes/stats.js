const express = require('express');
const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get stats for user
router.get('/user-summary', auth, async (req, res) => {
    try {
        const boards = await Board.find({ owner: req.user._id });
        const boardIds = boards.map(b => b._id);
        
        const lists = await List.find({ boardId: { $in: boardIds } });
        const listIds = lists.map(l => l._id);

        const cards = await Card.find({ listId: { $in: listIds } });

        const stats = {
            totalBoards: boards.length,
            totalTasks: cards.length,
            byPriority: {
                low: cards.filter(c => c.priority === 'low').length,
                medium: cards.filter(c => c.priority === 'medium').length,
                high: cards.filter(c => c.priority === 'high').length
            },
            byStatus: {}
        };

        // Calculate tasks by status (list title)
        lists.forEach(list => {
            const listCardsCount = cards.filter(c => c.listId.toString() === list._id.toString()).length;
            const statusName = list.title;
            stats.byStatus[statusName] = (stats.byStatus[statusName] || 0) + listCardsCount;
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
