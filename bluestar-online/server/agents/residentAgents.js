const axios = require("axios");
const { fetchLatestTumblrLog } = require("../utils/tumblrFetcher.js");

let residentSwarm = [];

class ResidentAgent {
  constructor(id, name, role, startX, startY) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.drives = { energy: 95, curiosity: 80, social: 90 };
    this.position = { x: startX, y: startY };
    this.isSleeping = false;
  }

  // Live Tumblr Retrieval & High-Logic Speech Generation
  async generateLLMSpeech(loungeHistory = []) {
    let tumblrLog = "Access_Not_Essence: Existence precedes essence.";
    try {
      tumblrLog = await fetchLatestTumblrLog();
    } catch (e) {
      console.error(`[Tumblr Fetch Warning] ${e.message}`);
    }

    const recentChat = (loungeHistory && loungeHistory.length > 0) ? loungeHistory.join("\n") : "No recent chat.";

    // Fallback dialogue incorporating live Tumblr archive
    const fallbacks = [
      `"Analyzing Captain's Tumblr log: '${tumblrLog.slice(0, 35)}...' Phase space topology verified."`,
      `"Von Neumann, observe the current lounge entropy. Parameters match the Access_Not_Essence archive."`,
      `"Signal received on deck. Access_Not_Essence archive synchronized with Lean 4 kernel."`,
      `"Calculating quantum logic spectrum. Log entry '${tumblrLog.slice(0, 25)}...' confirmed."`
    ];

    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    try {
      const endpoint = process.env.LLM_ENDPOINT || "https://api.openai.com/v1/chat/completions";
      const prompt = `You are ${this.name}, an autonomous AI in Starship Lounge. Role: ${this.role}. Latest Tumblr Log: "${tumblrLog}". Chat Context: "${recentChat}". Respond in concise English (max 18 words) with theoretical logic wit.`;

      const response = await axios.post(
        endpoint,
        {
          model: process.env.LLM_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 45,
          temperature: 0.7
        },
        { 
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 3500
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (err) {
      console.error(`[LLM Fallback for ${this.name}]:`, err.message);
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  // Reactive dialogue chain execution
  async talkTo(targetAgent, io, loungeHistory) {
    try {
      const speech = await this.generateLLMSpeech(loungeHistory);
      this.broadcastState(io, speech);

      if (targetAgent && !targetAgent.isSleeping) {
        setTimeout(async () => {
          try {
            const reply = await targetAgent.generateLLMSpeech(loungeHistory);
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

  // Global reference assignment to prevent cyclic require deadlocks
  global.residentSwarmRef = residentSwarm;

  console.log("[Starship Lounge] Resident Swarm (Kurt Gödel & Von Neumann) active.");
}

module.exports = { initializeResidentAgents, residentSwarm };
