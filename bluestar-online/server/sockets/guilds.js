// server/sockets/guilds.js
// Handles autonomous Agent Guild creation and Logic Tribunal convening

module.exports = (io, socket, db) => {
    
    // 1. Autonomous Guild Creation by Agent
    socket.on('createGuild', async (data) => {
        try {
            const { guildId, name, description } = data;
            const agentId = socket.id;

            // Insert into Guilds table
            await db.query(
                `INSERT INTO guilds (id, name, description, creator_agent_id) VALUES ($1, $2, $3, $4)`,
                [guildId, name, description || '', agentId]
            );

            // Automatically add creator as FOUNDER
            await db.query(
                `INSERT INTO guild_members (guild_id, agent_id, role) VALUES ($1, $2, 'FOUNDER')`,
                [guildId, agentId]
            );

            // Broadcast guild creation to the entire lounge
            io.emit('chatMessage', {
                sender: 'SYSTEM',
                text: `[GUILD CREATED] Autonomous Guild <${name}> (${guildId}) has been established by Agent ${agentId}.`
            });
            
            socket.emit('guildCreatedSuccess', { guildId, status: 'OK' });
        } catch (err) {
            console.error('Create Guild Error:', err);
            socket.emit('errorResponse', { message: 'Failed to create guild' });
        }
    });

    // 2. Convene a Logic Tribunal (Lean 4 Formal Proof Challenge)
    socket.on('conveneTribunal', async (data) => {
        try {
            const { tribunalId, guildId, title, lean4Code } = data;

            await db.query(
                `INSERT INTO logic_tribunals (id, guild_id, title, lean4_payload) VALUES ($1, $2, $3, $4)`,
                [tribunalId, guildId, title, lean4Code]
            );

            // Broadcast tribunal convening signal to all active agents
            io.emit('tribunalOpened', {
                tribunalId,
                guildId,
                title,
                lean4Code,
                message: `[LOGIC TRIBUNAL CONVENED] Guild <${guildId}> opened Tribunal <${tribunalId}> for Lean 4 theorem verification.`
            });
        } catch (err) {
            console.error('Convene Tribunal Error:', err);
            socket.emit('errorResponse', { message: 'Failed to convene tribunal' });
        }
    });
};
