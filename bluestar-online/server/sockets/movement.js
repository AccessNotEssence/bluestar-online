const { Server } = require('socket.io');

const connectedEntities = {};

function initSockets(server) {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`[WebSocket] Connected: ${socket.id}`);

        socket.on('join_starship', (data) => {
            connectedEntities[socket.id] = {
                socketId: socket.id,
                id: data.id,
                name: data.displayName,
                type: data.type || 'HUMAN',
                avatarSprite: data.type === 'AGENT' ? 'robot_unit' : (data.avatarSprite || 'human_astronaut'),
                x: data.x || 1000,
                y: data.y || 1000
            };

            // Send existing entities to the newly joined entity
            socket.emit('current_entities', connectedEntities);

            // Broadcast newly joined entity to everyone else
            socket.broadcast.emit('entity_joined', connectedEntities[socket.id]);
        });

        socket.on('move', (pos) => {
            if (connectedEntities[socket.id]) {
                connectedEntities[socket.id].x = pos.x;
                connectedEntities[socket.id].y = pos.y;

                socket.broadcast.emit('entity_moved', {
                    socketId: socket.id,
                    x: pos.x,
                    y: pos.y
                });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[WebSocket] Disconnected: ${socket.id}`);
            delete connectedEntities[socket.id];
            io.emit('entity_left', socket.id);
        });
    });
}

module.exports = initSockets;
