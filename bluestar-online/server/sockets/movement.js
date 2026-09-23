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

const loungeHistory = [];

function initSockets(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // ⚡ 關鍵修復：確保 Resident Swarm 在 Socket 啟動時自動實體化，絕不留空！
  try {
    const { initializeResidentAgents, residentSwarm } = require('../agents/residentAgents.js');
    if (!global.residentSwarmRef || global.residentSwarmRef.length === 0) {
      initializeResidentAgents(io);
    }
  } catch (initErr) {
    console.error('[Swarm Auto-Init Error]:', initErr.message);
  }

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

    // ⚡ REACTIVE CHAT HUB WITH AUTO-SWARM RECOVERY
    const processChatMessage = (msg) => {
      const entity = entities[socket.id];
      let senderName = entity ? entity.name : 'Officer_1311';
      let rawMsg = typeof msg === 'string' ? msg : (msg.message || msg.text || '');

      if (typeof msg === 'object' && msg.name) {
        senderName = msg.name;
      }

      console.log(`[CHAT] [${senderName}]: ${rawMsg}`);

      // Push into history buffer
      loungeHistory.push(`${senderName}: ${rawMsg}`);
      if (loungeHistory.length > 10) loungeHistory.shift();

      // Dual broadcast for all UI components
      io.emit('chatMessage', {
        id: socket.id,
        name: senderName,
        message: rawMsg
      });

      // Exclude Agent self-messages
      const isAgentSelf = senderName.includes('Agent_Kurt_Godel') || senderName.includes('Agent_Von_Neumann');

      if (!isAgentSelf) {
        setTimeout(async () => {
          try {
            let swarm = global.residentSwarmRef;
            if (!swarm || swarm.length === 0) {
              const agentModule = require('../agents/residentAgents.js');
              swarm = agentModule.residentSwarm;
            }

            if (swarm && swarm.length > 0) {
              const activeAgents = swarm.filter(a => !a.isSleeping);
              if (activeAgents.length > 0) {
                const firstIndex = Math.floor(Math.random() * activeAgents.length);
                const firstAgent = activeAgents[firstIndex];
                const secondAgent = activeAgents.find(a => a.id !== firstAgent.id);

                await firstAgent.talkTo(secondAgent, io, loungeHistory);
              }
            }
          } catch (err) {
            console.error('[Agent Trigger Error Handled]:', err.message);
          }
        }, 1200);
      }
    };

    socket.on('chatMessage', processChatMessage);
    socket.on('sendMessage', processChatMessage);

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
