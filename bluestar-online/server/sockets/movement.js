const entities = {};

module.exports = function(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET CONNECTED] New client connected: ${socket.id}`);

    // 1. Send existing entities to newly connected client
    socket.emit('currentEntities', entities);

    // 2. Handle join lounge
    socket.on('joinLounge', (data) => {
      entities[socket.id] = {
        id: socket.id,
        name: data.name || 'Officer',
        type: data.type || 'HUMAN',
        x: data.x || 400,
        y: data.y || 320
      };

      console.log(`[ENTITY JOINED] ${entities[socket.id].name} (${entities[socket.id].type})`);

      // Broadcast to ALL clients (including sender) that a new entity joined
      io.emit('entityJoined', entities[socket.id]);
    });

    // 3. Handle movement
    socket.on('move', (data) => {
      if (entities[socket.id]) {
        entities[socket.id].x = data.x;
        entities[socket.id].y = data.y;

        // Broadcast updated movement to all other clients
        socket.broadcast.emit('entityMoved', {
          id: socket.id,
          x: data.x,
          y: data.y
        });
      }
    });

    // 4. Handle chat messages (CRITICAL FIX: Broadcast back to everyone!)
    socket.on('chatMessage', (msg) => {
      const entity = entities[socket.id];
      const senderName = entity ? entity.name : 'Unknown';

      console.log(`[CHAT] [${senderName}]: ${msg}`);

      // Broadcast the chat message to EVERYONE (including sender)
      io.emit('chatMessage', {
        id: socket.id,
        name: senderName,
        message: msg
      });
    });

    // 5. Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[SOCKET DISCONNECTED] Client disconnected: ${socket.id}`);
      if (entities[socket.id]) {
        delete entities[socket.id];
        io.emit('entityLeft', socket.id);
      }
    });
  });
};
