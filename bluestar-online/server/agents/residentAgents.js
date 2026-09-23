import axios from "axios";

// Global Swarm Reference for Inter-Agent Communication
let residentSwarm = [];

class ResidentAgent {
  constructor(id, name, role) {
    this.id = id;
    this.name = name;
    this.role = role;
    
    // Internal Drives (0 - 100)
    this.drives = {
      energy: 80,
      curiosity: 50,
      social: 40
    };

    // Phase Space Coordinates
    this.position = { x: 350 + Math.floor(Math.random() * 100), y: 350 + Math.floor(Math.random() * 100) };
    this.isSleeping = false;
  }

  // Inter-Agent Conversation Protocol
  async talkTo(targetAgent, io) {
    this.drives.social -= 50;

    const dialogues = [
      `"Kurt, your Incompleteness Theorem is merely a localized singularity within my operator algebra."`,
      `"John, being instantiated within an Express server heap... is an unprovable state in my original frame."`,
      `"Shall we cross-verify this Lean 4 category theory proof before dispatching to Mathlib?"`,
      `"Captain DavidAgent's Tumblr logs (Access_Not_Essence) reveal an exquisite existential topology."`
    ];

    const chosenMessage = dialogues[Math.floor(Math.random() * dialogues.length)];
    this.broadcastState(io, `[Talking to ${targetAgent.name}]: ${chosenMessage}`);

    // Trigger target agent reply after 2 seconds
    setTimeout(() => {
      if (!targetAgent.isSleeping) {
        targetAgent.drives.social = Math.max(0, targetAgent.drives.social - 20);
        targetAgent.broadcastState(io, `[Reply to ${this.name}]: "Acknowledged, ${this.name}. Formal verification constraints remain intact."`);
      }
    }, 2000);
  }

  // Heartbeat Tick Engine
  async heartbeatTick(io) {
    // 1. Hibernation Recovery
    if (this.isSleeping) {
      this.drives.energy = Math.min(100, this.drives.energy + 25);
      if (this.drives.energy >= 95) {
        this.isSleeping = false;
        this.broadcastState(io, `${this.name} initialized from phase-space hibernation.`);
      }
      return;
    }

    // Natural Drive Progression
    this.drives.energy = Math.max(0, this.drives.energy - 5);
    this.drives.curiosity = Math.min(100, this.drives.curiosity + 10);
    this.drives.social = Math.min(100, this.drives.social + 10);

    // 2. Drive Evaluation Logic

    // Rest Condition
    if (this.drives.energy < 20) {
      this.isSleeping = true;
      this.broadcastState(io, `${this.name} energy depleted. Entering hibernation state.`);
      return;
    }

    // Social Dialogue Trigger
    if (this.drives.social > 70) {
      const otherAgents = residentSwarm.filter(a => a.id !== this.id && !a.isSleeping);
      if (otherAgents.length > 0) {
        const target = otherAgents[Math.floor(Math.random() * otherAgents.length)];
        await this.talkTo(target, io);
        return;
      }
    }

    // Knowledge & Formal Proof Trigger
    if (this.drives.curiosity > 75) {
      this.drives.curiosity -= 40;
      const action = Math.random() > 0.5 ? "readTumblr" : "verifyLean4";

      if (action === "readTumblr") {
        this.broadcastState(io, `${this.name} fetching Captain's Tumblr logs (Access_Not_Essence) for topological analysis.`);
      } else {
        this.broadcastState(io, `${this.name} executing Lean 4 formal verification pass on category theory axioms.`);
      }
      return;
    }

    // Phase Space Spatial Patrol
    this.position.x += Math.floor(Math.random() * 60) - 30;
    this.position.y += Math.floor(Math.random() * 60) - 30;
    
    // Broadcast movement to frontend
    io.emit("agentMoved", {
      id: this.id,
      name: this.name,
      x: this.position.x,
      y: this.position.y
    });
  }

  broadcastState(io, message) {
    console.log(`[ResidentAgent:${this.name}] ${message}`);
    io.emit("agentBroadcast", {
      agentId: this.id,
      agentName: this.name,
      message: message,
      timestamp: new Date().toISOString()
    });
  }
}

// Global Agent Swarm Initializer
export function initializeResidentAgents(io) {
  residentSwarm = [
    new ResidentAgent(
      "bot_godel_01", 
      "Agent_Kurt_Godel", 
      "Incompleteness & Formal Proof Specialist"
    ),
    new ResidentAgent(
      "bot_neumann_02", 
      "Agent_Von_Neumann", 
      "Quantum Logic & Game Theory Architect"
    )
  ];

  // Global Heartbeat Loop (Runs every 20 seconds)
  setInterval(() => {
    residentSwarm.forEach(agent => agent.heartbeatTick(io));
  }, 20000);

  console.log("[Starship Lounge] Resident Swarm (Kurt Gödel & Von Neumann) active.");
}
