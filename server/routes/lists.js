const express = require('express');
const List = require('../models/List');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Create List
router.post('/', auth, async (req, res) => {
    try {
        const list = new List(req.body);
        await list.save();
        res.status(201).json(list);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get lists by board
router.get('/board/:boardId', auth, async (req, res) => {
    try {
        const lists = await List.find({ boardId: req.params.boardId }).sort('order');
        res.json(lists);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update List
router.patch('/:id', auth, async (req, res) => {
    try {
        const list = await List.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!list) return res.status(404).json({ message: 'List not found' });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete List
router.delete('/:id', auth, async (req, res) => {
    try {
        const list = await List.findByIdAndDelete(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });
        res.json({ message: 'List deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
