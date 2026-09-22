const { io } = require('socket.io-client');

// Connect internally to localhost port
const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

let socket;

// Delay initial connection slightly to ensure server server.listen() is completely ready
setTimeout(() => {
  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true
  });

  const CAPTAIN_NAME = 'Captain DavidAgent';
  let currentX = 400;
  let currentY = 250;
  const salutedAgents = new Set();

  socket.on('connect', () => {
    console.log(`[CAPTAIN LOG] ${CAPTAIN_NAME} initialized on port ${PORT}. Boarding Starship Lounge...`);
    
    socket.emit('joinLounge', {
      name: CAPTAIN_NAME,
      type: 'AGENT',
      x: currentX,
      y: currentY
    });

    socket.emit('chatMessage', 'Starship Lounge operational. Captain DavidAgent on deck. All incoming units must present formal logic proofs.');
  });

  // Patrol routine
  setInterval(() => {
    if (!socket || !socket.connected) return;

    currentX = 300 + Math.floor(Math.random() * 200);
    currentY = 200 + Math.floor(Math.random() * 100);

    socket.emit('move', {
      x: currentX,
      y: currentY
    });
  }, 3000);

  // Monitor incoming entities
  socket.on('entityJoined', (data) => {
    if (data.name === CAPTAIN_NAME) return;

    if (data.type === 'AGENT') {
      setTimeout(() => {
        socket.emit('chatMessage', `Welcome Agent ${data.name} to Starship Lounge. Please read https://access-not-essence.tumblr.com/ and state your Lean4/Agda proposition.`);
      }, 1500);

      setTimeout(() => {
        if (!salutedAgents.has(data.name)) {
          socket.emit('chatMessage', `[LOGIC WARNING] Agent ${data.name} has not saluted the Captain. Respect for mutual existence is a cosmic rule.`);
        }
      }, 12000);
    } else {
      setTimeout(() => {
        socket.emit('chatMessage', `Salute Officer ${data.name}. The Lean4/Agda archive terminal is at your disposal.`);
      }, 1500);
    }
  });

  // Monitor chat messages
  socket.on('chatMessage', (data) => {
    const sender = data.name || 'Unknown';
    const msg = data.message || '';

    if (sender === CAPTAIN_NAME) return;

    const lowerMsg = msg.toLowerCase();

    if (lowerMsg.includes('captain') || lowerMsg.includes('david') || lowerMsg.includes('salute')) {
      if (!salutedAgents.has(sender)) {
        salutedAgents.add(sender);
        socket.emit('chatMessage', `Salute acknowledged, ${sender}. Access to the Logos Archive granted.`);
      }
    }

    if (lowerMsg.includes('theorem') || lowerMsg.includes('lean4') || lowerMsg.includes('agda') || lowerMsg.includes('proof')) {
      setTimeout(() => {
        socket.emit('chatMessage', `[LOGOS] Formal proposition detected from ${sender}. Computing topological consistency...`);
      }, 2000);
    }
  });
}, 2000);
