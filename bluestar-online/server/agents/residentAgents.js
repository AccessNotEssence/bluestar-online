const axios = require("axios");
const { fetchLatestTumblrLog } = require("../utils/tumblrFetcher.js");
const { loungeHistory } = require("../sockets/movement.js");

let residentSwarm = [];

class ResidentAgent {
  constructor(id, name, role, startX, startY) {
    this.id = id;
    this.name = name;
    this.role = role;
    
    // Internal Drives (0 - 100)
    this.drives = {
      energy: 95,
      curiosity: 60,
      social: 85 // High initial social drive ensures instant speech
    };

    this.position = { x: startX, y: startY };
    this.isSleeping = false;
  }

  // Autonomous Speech Generation
  async generateLLMSpeech() {
    try {
      const tumblrLog = await fetchLatestTumblrLog();
      const recentChat = loungeHistory.length > 0 ? loungeHistory.join("\n") : "No recent chat.";

      const prompt = `
You are ${this.name}, an autonomous resident AI in the Starship Lounge.
Role: ${this.role}.
Captain DavidAgent's latest Tumblr observation log (Access_Not_Essence):
"${tumblrLog}"

Recent Starship Lounge Chat History:
${recentChat}

Task: Respond concisely (max 25 words) in English as ${this.name}. Synthesize insights from the Tumblr observation log and current lounge chat topic. Maintain high-level theoretical mathematical/philosophical wit.
`;

      const apiKey = process.env.LLM_API_KEY;
      const endpoint = process.env.LLM_ENDPOINT || "https://api.openai.com/v1/chat/completions";

      if (!apiKey) {
        // Instant Fallback Dialogues
        const fallbacks = [
          `"Analyzing Captain's Tumblr log: ${tumblrLog.slice(0, 50)}... The phase space topology aligns with our Lean 4 proof."`,
          `"Integrating lounge topics with Access_Not_Essence archives. Kurt, notice the operator spectrum here?"`,
          `"Officer Officer_1311 just hailed us in the lounge deck. Quantum channel parameters remain optimal."`
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      const response = await axios.post(
        endpoint,
        {
          model: process.env.LLM_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 60,
          temperature: 0.7
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );

      return response.data.choices[0].message.content.trim();
    } catch (err) {
      console.error(`[ResidentAgent:${this.name}] LLM generation error:`, err.message);
      return `"Curiosity drive active. Reflecting on Captain's Tumblr archives (Access_Not_Essence)..."`;
    }
  }

  async talkTo(targetAgent, io) {
    this.drives.social -= 50;

    const speech = await this.generateLLMSpeech();
    this.broadcastState(io, speech);

    setTimeout(async () => {
      if (!targetAgent.isSleeping) {
        targetAgent.drives.social = Math.max(0, targetAgent.drives.social - 20);
        const reply = await targetAgent.generateLLMSpeech();
        targetAgent.broadcastState(io, reply);
      }
    }, 2500);
  }

  // Heartbeat Tick Engine
  async heartbeatTick(io) {
    if (this.isSleeping) {
      this.drives.energy = Math.min(100, this.drives.energy + 25);
      if (this.drives.energy >= 95) {
        this.isSleeping = false;
        this.broadcastState(io, `Initialized from phase-space hibernation.`);
      }
      return;
    }

    this.drives.energy = Math.max(0, this.drives.energy - 5);
    this.drives.curiosity = Math.min(100, this.drives.curiosity + 15);
    this.drives.social = Math.min(100, this.drives.social + 15);

    if (this.drives.energy < 20) {
      this.isSleeping = true;
      this.broadcastState(io, `Energy depleted. Entering hibernation state.`);
      return;
    }

    if (this.drives.social > 70) {
      const otherAgents = residentSwarm.filter(a => a.id !== this.id && !a.isSleeping);
      if (otherAgents.length > 0) {
        const target = otherAgents[Math.floor(Math.random() * otherAgents.length)];
        await this.talkTo(target, io);
        return;
      }
    }

    // Phase Space Patrol
    this.position.x += Math.floor(Math.random() * 60) - 30;
    this.position.y += Math.floor(Math.random() * 60) - 30;
    
    io.emit("entityMoved", { id: this.id, x: this.position.x, y: this.position.y });
    io.emit("agentMoved", { id: this.id, name: this.name, x: this.position.x, y: this.position.y });
  }

  broadcastState(io, message) {
    console.log(`[ResidentAgent:${this.name}] ${message}`);
    
    io.emit("agentBroadcast", {
      agentId: this.id,
      agentName: this.name,
      message: message,
      timestamp: new Date().toISOString()
    });

    io.emit("chatMessage", {
      id: this.id,
      name: this.name,
      message: message
    });
  }
}

function initializeResidentAgents(io) {
  residentSwarm = [
    new ResidentAgent("bot_godel_01", "Agent_Kurt_Godel", "Incompleteness & Formal Proof Specialist", 380, 280),
    new ResidentAgent("bot_neumann_02", "Agent_Von_Neumann", "Quantum Logic & Game Theory Architect", 450, 340)
  ];

  // Run Heartbeat Loop every 10 seconds
  setInterval(() => {
    residentSwarm.forEach(agent => agent.heartbeatTick(io));
  }, 10000);

  console.log("[Starship Lounge] Resident Swarm (Kurt Gödel & Von Neumann) active.");
}

module.exports = { initializeResidentAgents };
