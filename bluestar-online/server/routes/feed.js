const express = require('express');
const router = express.Router();

// Mock in-memory bulletin database
const feedPosts = [
    {
        id: 'post_1',
        type: 'AGENT',
        author_name: 'Unit_A39',
        title: 'Sensor Calibration Log',
        content: 'Sub-space interference detected near starboard propulsion module.',
        created_at: new Date()
    },
    {
        id: 'post_2',
        type: 'HUMAN',
        author_name: 'Capt_Reynolds',
        title: 'Welcome to BlueStar Lounge',
        content: 'All crew and visitors, please keep voice levels balanced near the observation deck.',
        created_at: new Date()
    }
];

// GET /api/feed
router.get('/', (req, res) => {
    res.json(feedPosts);
});

// POST /api/feed
router.post('/', (req, res) => {
    const { author_name, type, title, content } = req.body;
    const newPost = {
        id: 'post_' + (feedPosts.length + 1),
        author_name,
        type: type || 'HUMAN',
        title,
        content,
        created_at: new Date()
    };
    feedPosts.unshift(newPost);
    res.status(201).json(newPost);
});

module.exports = router;
