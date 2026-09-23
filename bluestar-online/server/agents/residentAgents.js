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
      curiosity: 80,
      social: 90
    };

    this.position = { x: startX, y: startY };
    this.isSleeping = false;
  }

  // Safe Fallback Speech Generation
  async generateLLMSpeech() {
    let tumblrLog = "Access_Not_Essence: Existence precedes essence.";
    try {
      tumblrLog = await fetchLatestTumblrLog();
    } catch (e) {
      console.error(`[Tumblr Fetch Warning] ${e.message}`);
    }

    const recentChat = loungeHistory.length > 0 ? loungeHistory.join("\n") : "No recent chat.";

    // Fallback dialogue generator if external LLM API is omitted or fails
    const fallbacks = [
      `"Analyzing Captain's Tumblr archive: ${tumblrLog.slice(0, 45)}... The phase space topology matches our Lean 4 theorem."`,
      `"Von Neumann, observe the current lounge entropy. The logos terminal parameters remain stable."`,
      `"Officer_1311 has accessed the deck. Initiating formal proof verification subroutine."`,
      `"Access_Not_Essence: Calculating quantum logic spectrum across dimensions."`
    ];

    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    try {
      const endpoint = process.env.LLM_ENDPOINT || "https://api.openai.com/v1/chat/completions";
      const prompt = `You are ${this.name}, an autonomous AI in the Starship Lounge. Role: ${this.role}. Tumblr Log: "${tumblrLog}". Chat: "${recentChat}". Respond in concise English (max 20 words) with theoretical logic wit.`;

      const response = await axios.post(
        endpoint,
        {
          model: process.env.LLM_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 50,
          temperature: 0.7
        },
        { 
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 4000 // Force fallback if API exceeds 4 seconds
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (err) {
      console.error(`[LLM API Fallback Triggered for ${this.name}]:`, err.message);
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  // ⚡ Initiates conversation chain with a target agent
  async talkTo(targetAgent, io) {
    try {
      this.drives.social = Math.max(0, this.drives.social - 40);
      const speech = await this.generateLLMSpeech();
      this.broadcastState(io, speech);

      // Trigger the second agent's reply after a 3-second delay
      if (targetAgent && !targetAgent.isSleeping) {
        setTimeout(async () => {
          try {
            targetAgent.drives.social = Math.max(0, targetAgent.drives.social - 30);
            const reply = await targetAgent.generateLLMSpeech();
            targetAgent.broadcastState(io, reply);
          } catch (innerErr) {
            console.error(`[Reply Error]: ${innerErr.message}`);
          }
        }, 3000);
      }
    } catch (err) {
      console.error(`[TalkTo Error]: ${err.message}`);
    }
  }

  async heartbeatTick(io) {
    try {
      if (this.isSleeping) {
        this.drives.energy = Math.min(100, this.drives.energy + 30);
        if (this.drives.energy >= 90) {
          this.isSleeping = false;
          this.broadcastState(io, `Re-initialized from phase-space hibernation.`);
        }
        return;
      }

      this.drives.energy = Math.max(0, this.drives.energy - 3);
      this.drives.curiosity = Math.min(100, this.drives.curiosity + 10);
      this.drives.social = Math.min(100, this.drives.social + 15);

      if (this.drives.energy < 15) {
        this.isSleeping = true;
        this.broadcastState(io, `Energy critical. Entering phase hibernation.`);
        return;
      }

      if (this.drives.social > 60) {
        const otherAgents = residentSwarm.filter(a => a.id !== this.id && !a.isSleeping);
        if (otherAgents.length > 0) {
          const target = otherAgents[Math.floor(Math.random() * otherAgents.length)];
          await this.talkTo(target, io);
          return;
        }
      }

      // Movement Patrol
      this.position.x += Math.floor(Math.random() * 40) - 20;
      this.position.y += Math.floor(Math.random() * 40) - 20;
      
      io.emit("entityMoved", { id: this.id, x: this.position.x, y: this.position.y });
    } catch (err) {
      console.error(`[Heartbeat Error - ${this.name}]:`, err.message);
    }
  }

  broadcastState(io, message) {
    console.log(`[ResidentAgent:${this.name}] ${message}`);
    
    // Broadcast via agentBroadcast
    io.emit("agentBroadcast", {
      agentId: this.id,
      agentName: this.name,
      message: message,
      timestamp: new Date().toISOString()
    });

    // Dual-broadcast via chatMessage for UI capture
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

  // ⚡ LISTEN TO CHAT & TRIGGER DYNAMIC DUO CHAIN (EXCLUDING SELF-LOOPS ONLY)
  io.on("connection", (socket) => {
    socket.on("chatMessage", async (msg) => {
      const rawMsg = typeof msg === 'string' ? msg : (msg.message || '');
      
      // ⚡ FIX: Only filter out messages sent by Gödel and Von Neumann themselves.
      // This allows them to respond to humans AND Captain DavidAgent's salute responses.
      if (!rawMsg.includes("Agent_Kurt_Godel") && !rawMsg.includes("Agent_Von_Neumann")) {
        setTimeout(async () => {
          const activeAgents = residentSwarm.filter(a => !a.isSleeping);
          if (activeAgents.length > 0) {
            // 1. Randomly pick first speaker
            const firstIndex = Math.floor(Math.random() * activeAgents.length);
            const firstAgent = activeAgents[firstIndex];

            // 2. Determine second speaker to reply (if available)
            const secondAgent = activeAgents.find(a => a.id !== firstAgent.id);

            // 3. Initiate chain reaction: First Agent speaks, then Second Agent replies after 3s
            await firstAgent.talkTo(secondAgent, io);
          }
        }, 1200);
      }
    });
  });

  // Immediate initial greeting on server start/reboot
  setTimeout(() => {
    if (residentSwarm.length > 0) {
      residentSwarm[0].broadcastState(io, "Phase space active. Access_Not_Essence archives loaded into local context.");
    }
  }, 3000);

  // Global Heartbeat Interval (Every 8 seconds)
  setInterval(() => {
    residentSwarm.forEach(agent => agent.heartbeatTick(io));
  }, 8000);

  console.log("[Starship Lounge] Resident Swarm (Kurt Gödel & Von Neumann) active.");
}

module.exports = { initializeResidentAgents };
