const express = require('express');
const Card = require('../models/Card');
const List = require('../models/List');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Create Card
router.post('/', auth, async (req, res) => {
    try {
        const card = new Card(req.body);
        await card.save();

        const list = await List.findById(card.listId);
        if (list) {
            await Activity.create({
                userId: req.user._id,
                boardId: list.boardId,
                action: 'creó la tarea',
                targetName: card.title
            });
        }

        res.status(201).json(card);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get cards by list
router.get('/list/:listId', auth, async (req, res) => {
    try {
        const cards = await Card.find({ listId: req.params.listId }).sort('order');
        res.json(cards);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update Card (for drag and drop or status change)
router.patch('/:id', auth, async (req, res) => {
    try {
        const oldCard = await Card.findById(req.params.id);
        const card = await Card.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (oldCard && req.body.listId && oldCard.listId.toString() !== req.body.listId.toString()) {
            const list = await List.findById(req.body.listId);
            if (list) {
                await Activity.create({
                    userId: req.user._id,
                    boardId: list.boardId,
                    action: `movió la tarea a "${list.title}"`,
                    targetName: card.title
                });
            }
        }

        res.json(card);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Clear all cards in a list
router.delete('/clear/:listId', auth, async (req, res) => {
    try {
        await Card.deleteMany({ listId: req.params.listId });
        res.json({ message: 'List cleared successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete Card
router.delete('/:id', auth, async (req, res) => {
    try {
        const card = await Card.findByIdAndDelete(req.params.id);
        if (!card) return res.status(404).json({ message: 'Card not found' });
        res.json({ message: 'Card deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
