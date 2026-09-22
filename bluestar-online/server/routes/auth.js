const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// POST /api/auth/google
router.post('/google', async (req, res) => {
    const { token } = req.body;

    // Simulate Google OAuth token validation
    const userPayload = {
        id: 'usr_g_' + Math.random().toString(36).substr(2, 9),
        displayName: 'Officer_Cadet',
        type: 'HUMAN',
        avatarSprite: 'human_astronaut'
    };

    const jwtSecret = process.env.JWT_SECRET || 'bluestar_secret';
    const sessionToken = jwt.sign(userPayload, jwtSecret, { expiresIn: '24h' });

    res.json({
        status: 'SUCCESS',
        token: sessionToken,
        user: userPayload
    });
});

module.exports = router;
