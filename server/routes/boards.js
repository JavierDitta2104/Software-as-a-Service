const express = require('express');
const Board = require('../models/Board');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Create Board
router.post('/', auth, async (req, res) => {
    try {
        const board = new Board({
            ...req.body,
            owner: req.user._id
        });
        await board.save();
        res.status(201).json(board);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get all boards of user
router.get('/', auth, async (req, res) => {
    try {
        const boards = await Board.find({
            $or: [{ owner: req.user._id }, { members: req.user._id }]
        });
        res.json(boards);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update Board
router.patch('/:id', auth, async (req, res) => {
    try {
        const board = await Board.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            req.body,
            { new: true }
        );
        if (!board) return res.status(404).json({ message: 'Board not found' });
        res.json(board);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete Board
router.delete('/:id', auth, async (req, res) => {
    try {
        const board = await Board.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!board) return res.status(404).json({ message: 'Board not found' });
        
        // Cascading delete would go here (or via middleware)
        res.json({ message: 'Board deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
