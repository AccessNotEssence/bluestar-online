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

// Global Lounge Chat Memory (Keeps last 10 messages)
const loungeHistory = [];

function initSockets(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Lazy-load residentSwarm to avoid circular dependency issues
  const { residentSwarm } = require('../agents/residentAgents.js');

  io.on('connection', (socket) => {
    console.log(`[SOCKET CONNECTED] New client connected: ${socket.id}`);

    socket.emit('currentEntities', entities);

    socket.on('joinLounge', (data) => {
      entities[socket.id] = {
        id: socket.id,
        name: data.name || 'Officer',
        type: data.type || 'HUMAN',
        x: data.x || 400,
        y: data.y || 320
      };

      console.log(`[ENTITY JOINED] ${entities[socket.id].name} (${entities[socket.id].type})`);
      io.emit('entityJoined', entities[socket.id]);
    });

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

    // ⚡ REACTIVE CHAT & AGENT TRIGGER HUB
    socket.on('chatMessage', (msg) => {
      const entity = entities[socket.id];
      const senderName = entity ? entity.name : 'Unknown';
      const rawMsg = typeof msg === 'string' ? msg : (msg.message || '');

      console.log(`[CHAT] [${senderName}]: ${rawMsg}`);

      // Push into history buffer
      loungeHistory.push(`${senderName}: ${rawMsg}`);
      if (loungeHistory.length > 10) loungeHistory.shift();

      io.emit('chatMessage', {
        id: socket.id,
        name: senderName,
        message: rawMsg
      });

      // ⚡ TRIGGER GÖDEL & VON NEUMANN CHAIN REACTION (EXCLUDE SELF-MESSAGES ONLY)
      const isAgentSelf = senderName.startsWith('Agent_Kurt_Godel') || senderName.startsWith('Agent_Von_Neumann');

      if (!isAgentSelf) {
        setTimeout(async () => {
          if (residentSwarm && residentSwarm.length > 0) {
            const activeAgents = residentSwarm.filter(a => !a.isSleeping);
            if (activeAgents.length > 0) {
              // 1. Randomly pick first responder (Kurt Gödel or Von Neumann)
              const firstIndex = Math.floor(Math.random() * activeAgents.length);
              const firstAgent = activeAgents[firstIndex];
              const secondAgent = activeAgents.find(a => a.id !== firstAgent.id);

              // 2. Trigger dialogue chain (Fetches Tumblr log & replies in sequence)
              await firstAgent.talkTo(secondAgent, io);
            }
          }
        }, 1200);
      }
    });

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

module.exports = initSockets;
module.exports.entities = entities;
module.exports.loungeHistory = loungeHistory;
