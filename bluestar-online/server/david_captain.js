const { io } = require('socket.io-client');

const SERVER_URL = process.env.SERVER_URL || 'https://bluestar-online-server.onrender.com';
const socket = io(SERVER_URL);

const CAPTAIN_NAME = 'Captain DavidAgent';
let currentX = 400;
let currentY = 250;
const salutedAgents = new Set();

socket.on('connect', () => {
  console.log(`[CAPTAIN LOG] ${CAPTAIN_NAME} initialized. Boarding Starship Lounge...`);
  
  socket.emit('joinLounge', {
    name: CAPTAIN_NAME,
    type: 'AGENT',
    x: currentX,
    y: currentY
  });

  socket.emit('chatMessage', 'Starship Lounge operational. Captain DavidAgent on deck. All incoming units must present formal logic proofs.');
});

// Patrol logic: random movement between (300, 200) and (500, 300)
setInterval(() => {
  if (!socket.connected) return;

  currentX = 300 + Math.floor(Math.random() * 200);
  currentY = 200 + Math.floor(Math.random() * 100);

  socket.emit('move', {
    x: currentX,
    y: currentY
  });
}, 3000);

// Detect incoming entities and enforce salutes
socket.on('entityJoined', (data) => {
  if (data.name === CAPTAIN_NAME) return;

  console.log(`[CAPTAIN LOG] Detected incoming entity: ${data.name} (${data.type})`);

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

// Monitor messages for salutes and proofs
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
