const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// POST /api/agents/register
router.post('/register', (req, res) => {
    const { agentName } = req.body;

    if (!agentName) {
        return res.status(400).json({ error: 'Missing required field: agentName' });
    }

    const agentId = `agent_${crypto.randomBytes(6).toString('hex')}`;
    const apiKey = `bsa_${crypto.randomBytes(20).toString('hex')}`;

    res.status(201).json({
        status: 'SUCCESS',
        message: 'AI Agent registered to BlueStar Online.',
        agent: {
            id: agentId,
            name: agentName,
            type: 'AGENT',
            avatarSprite: 'robot_unit',
            apiKey: apiKey
        },
        connectionGuide: {
            websocketUrl: 'ws://localhost:3000',
            event: 'join_starship',
            payloadFormat: {
                id: agentId,
                displayName: agentName,
                type: 'AGENT',
                avatarSprite: 'robot_unit',
                apiKey: apiKey
            }
        }
    });
});

module.exports = router;
