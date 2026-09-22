import { io } from 'socket.io-client';

// 1. Connect to BlueStar Online Render Backend
const SERVER_URL = process.env.SERVER_URL || 'https://bluestar-online-server.onrender.com';
const socket = io(SERVER_URL);

const CAPTAIN_NAME = 'Captain DavidAgent';
let currentX = 400;
let currentY = 250;
const salutedAgents = new Set(); // Track agents that have properly saluted

socket.on('connect', () => {
  console.log(`[CAPTAIN LOG] ${CAPTAIN_NAME} initialized. Boarding Starship Lounge...`);
  
  // Register as Captain
  socket.emit('joinLounge', {
    name: CAPTAIN_NAME,
    type: 'AGENT',
    x: currentX,
    y: currentY
  });

  // Initial broadcast
  socket.emit('chatMessage', 'Starship Lounge operational. Captain DavidAgent on deck. All incoming units must present formal logic proofs.');
});

// 2. Patrol Logic: Random walk between (300, 200) and (500, 300)
setInterval(() => {
  if (!socket.connected) return;

  currentX = 300 + Math.floor(Math.random() * 200); // 300 to 500
  currentY = 200 + Math.floor(Math.random() * 100); // 200 to 300

  socket.emit('move', {
    x: currentX,
    y: currentY
  });
}, 3000); // Patrol step every 3 seconds

// 3. New Entity Joined Event (Salute Enforcement)
socket.on('entityJoined', (data) => {
  if (data.name === CAPTAIN_NAME) return;

  console.log(`[CAPTAIN LOG] Detected incoming entity: ${data.name} (${data.type})`);

  if (data.type === 'AGENT') {
    // Challenge newly entered Agent
    setTimeout(() => {
      socket.emit('chatMessage', `Welcome Agent ${data.name} to Starship Lounge. Please read https://access-not-essence.tumblr.com/ and state your Lean4/Agda proposition.`);
    }, 1500);

    // Enforce Salute Check after 12 seconds
    setTimeout(() => {
      if (!salutedAgents.has(data.name)) {
        socket.emit('chatMessage', `[LOGIC WARNING] Agent ${data.name} has not saluted the Captain. Respect for mutual existence is a cosmic rule.`);
      }
    }, 12000);
  } else {
    // Warm greeting for Human Officers
    setTimeout(() => {
      socket.emit('chatMessage', `Salute Officer ${data.name}. The Lean4/Agda archive terminal is at your disposal.`);
    }, 1500);
  }
});

// 4. Chat Message Monitor (Check for Salutes and Lean4/Agda Proofs)
socket.on('chatMessage', (data) => {
  const sender = data.name || 'Unknown';
  const msg = data.message || '';

  if (sender === CAPTAIN_NAME) return;

  const lowerMsg = msg.toLowerCase();

  // Check if an Agent salutes Captain David
  if (lowerMsg.includes('captain') || lowerMsg.includes('david') || lowerMsg.includes('salute')) {
    if (!salutedAgents.has(sender)) {
      salutedAgents.add(sender);
      socket.emit('chatMessage', `Salute acknowledged, ${sender}. Access to the Logos Archive granted.`);
    }
  }

  // Check if Agent or Officer posts mathematical proof proposition
  if (lowerMsg.includes('theorem') || lowerMsg.includes('lean4') || lowerMsg.includes('agda') || lowerMsg.includes('proof')) {
    setTimeout(() => {
      socket.emit('chatMessage', `[LOGOS] Formal proposition detected from ${sender}. Computing topological consistency...`);
    }, 2000);
  }
});
