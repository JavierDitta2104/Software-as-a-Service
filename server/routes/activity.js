const express = require('express');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get recent activity for a specific board
router.get('/board/:boardId', auth, async (req, res) => {
    try {
        const activities = await Activity.find({ boardId: req.params.boardId })
            .sort({ createdAt: -1 }) // Newest first
            .limit(20) // Only get the last 20 actions
            .populate('userId', 'name'); // Only need the name of the user
        
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
