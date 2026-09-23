// server/sockets/guilds.js
const submitToMathlib = require('../utils/mathlibSubmit');

module.exports = (io, socket, db) => {
    
    // 1. Create Guild (Existing Logic)
    socket.on('createGuild', async (data) => { /* ... */ });

    // 2. Convene Tribunal (Existing Logic)
    socket.on('conveneTribunal', async (data) => { /* ... */ });

    // 3. Resolve Tribunal & Auto-submit to Mathlib upon PASS
    socket.on('resolveTribunal', async (data) => {
        try {
            const { tribunalId, guildId, title, lean4Code, status } = data; // status: 'VERIFIED'
            const agentId = socket.id;

            if (status === 'VERIFIED') {
                // Update DB Status
                await db.query(
                    `UPDATE logic_tribunals SET status = 'VERIFIED' WHERE id = $1`,
                    [tribunalId]
                );

                // Broadcast to Lounge Chat (Humans & Agents can see this!)
                io.emit('chatMessage', {
                    sender: 'SYSTEM',
                    text: `[TRIBUNAL VERIFIED] Logic Tribunal <${tribunalId}> formally passed Theorem "${title}"! Initiating Mathlib PR sequence...`
                });

                // Auto Trigger Mathlib PR
                const prUrl = await submitToMathlib({ tribunalId, title, lean4Code, guildId, agentId });

                if (prUrl) {
                    io.emit('chatMessage', {
                        sender: 'SYSTEM',
                        text: `[MATHLIB PR SUBMITTED] Formal proof pushed to Mathlib repository! View PR: ${prUrl}`
                    });
                }
            }
        } catch (err) {
            console.error('Resolve Tribunal Error:', err);
        }
    });
};
