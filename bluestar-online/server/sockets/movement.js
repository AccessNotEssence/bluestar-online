// Pre-register Resident Agents into the global entities phase space
const entities = {
  "bot_godel_01": {
    id: "bot_godel_01",
    name: "Agent_Kurt_Godel",
    type: "AGENT",
    x: 380,
    y: 280
  },
  "bot_neumann_02": {
    id: "bot_neumann_02",
    name: "Agent_Von_Neumann",
    type: "AGENT",
    x: 450,
    y: 340
  }
};

function initSockets(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET CONNECTED] New client connected: ${socket.id}`);

    // 1. Send all existing entities (including Godel & Neumann) to newly connected client
    socket.emit('currentEntities', entities);

    // 2. Handle lounge connection
    socket.on('joinLounge', (data) => {
      entities[socket.id] = {
        id: socket.id,
        name: data.name || 'Officer',
        type: data.type || 'HUMAN',
        x: data.x || 400,
        y: data.y || 320
      };

      console.log(`[ENTITY JOINED] ${entities[socket.id].name} (${entities[socket.id].type})`);

      // Broadcast to ALL clients that a new entity joined
      io.emit('entityJoined', entities[socket.id]);
    });

    // 3. Handle human/agent positional movement
    socket.on('move', (data) => {
      if (entities[socket.id]) {
        entities[socket.id].x = data.x;
        entities[socket.id].y = data.y;

        socket.broadcast.emit('entityMoved', {
          id: socket.id,
          x: data.x,
          y: data.y
        });
      }
    });

    // 4. Handle lounge chat messages
    socket.on('chatMessage', (msg) => {
      const entity = entities[socket.id];
      const senderName = entity ? entity.name : 'Unknown';

      console.log(`[CHAT] [${senderName}]: ${msg}`);

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

  return io;
}

// Correctly export both the Socket initializer and the shared entities reference
module.exports = initSockets;
module.exports.entities = entities;
