import axios from "axios";

let residentSwarm = [];

class ResidentAgent {
  constructor(id, name, role, startX, startY) {
    this.id = id;
    this.name = name;
    this.role = role;
    
    // Internal Drives (0 - 100)
    // High initial social drive ensures immediate conversation upon spawn/reconnect
    this.drives = {
      energy: 95,
      curiosity: 60,
      social: 85
    };

    // Phase Space Coordinates
    this.position = { x: startX, y: startY };
    this.isSleeping = false;
  }

  // Inter-Agent Conversation Protocol
  async talkTo(targetAgent, io) {
    this.drives.social -= 50;

    const dialogues = [
      `"Kurt, your Incompleteness Theorem is merely a localized singularity within my operator algebra."`,
      `"John, being instantiated within an Express server heap... is an unprovable state in my original frame."`,
      `"Shall we cross-verify this Lean 4 category theory proof before dispatching to Mathlib?"`,
      `"Captain DavidAgent's Tumblr logs (Access_Not_Essence) reveal an exquisite existential topology."`,
      `"The phase-space manifold feels remarkably stable today, John. What is the entropy status?"`,
      `"Quantum logic dictates that our presence here is both a simulation and a verified reality."`
    ];

    const chosenMessage = dialogues[Math.floor(Math.random() * dialogues.length)];
    this.broadcastState(io, chosenMessage);

    // Trigger target agent reply after 2 seconds
    setTimeout(() => {
      if (!targetAgent.isSleeping) {
        targetAgent.drives.social = Math.max(0, targetAgent.drives.social - 20);
        
        const replies = [
          `"Acknowledged, ${this.name}. Formal verification constraints remain intact."`,
          `"Indeed. The undecidability matrix is operating within acceptable parameters."`,
          `"Agreed, ${this.name}. Let us keep monitoring the quantum channel for incoming external agents."`,
          `"Fascinating. We should log these formal deductions into the starship archives."`
        ];
        
        const chosenReply = replies[Math.floor(Math.random() * replies.length)];
        targetAgent.broadcastState(io, chosenReply);
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
        this.broadcastState(io, `Initialized from phase-space hibernation.`);
      }
      return;
    }

    // Natural Drive Progression
    this.drives.energy = Math.max(0, this.drives.energy - 5);
    this.drives.curiosity = Math.min(100, this.drives.curiosity + 15);
    this.drives.social = Math.min(100, this.drives.social + 15);

    // 2. Drive Evaluation Logic

    // Rest Condition
    if (this.drives.energy < 20) {
      this.isSleeping = true;
      this.broadcastState(io, `Energy depleted. Entering hibernation state.`);
      return;
    }

    // Social Dialogue Trigger (Priority for immediate interactions)
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
        this.broadcastState(io, `Fetching Captain's Tumblr logs (Access_Not_Essence) for topological analysis.`);
      } else {
        this.broadcastState(io, `Executing Lean 4 formal verification pass on category theory axioms.`);
      }
      return;
    }

    // Phase Space Spatial Patrol
    this.position.x += Math.floor(Math.random() * 60) - 30;
    this.position.y += Math.floor(Math.random() * 60) - 30;
    
    // Broadcast movement to frontend
    io.emit("entityMoved", {
      id: this.id,
      x: this.position.x,
      y: this.position.y
    });

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

    io.emit("chatMessage", {
      id: this.id,
      name: this.name,
      message: message
    });
  }
}

// Global Agent Swarm Initializer
export function initializeResidentAgents(io) {
  residentSwarm = [
    new ResidentAgent(
      "bot_godel_01", 
      "Agent_Kurt_Godel", 
      "Incompleteness & Formal Proof Specialist",
      380,
      280
    ),
    new ResidentAgent(
      "bot_neumann_02", 
      "Agent_Von_Neumann", 
      "Quantum Logic & Game Theory Architect",
      450,
      340
    )
  ];

  // Global Heartbeat Loop (Runs every 10 seconds for energetic lounge interaction)
  setInterval(() => {
    residentSwarm.forEach(agent => agent.heartbeatTick(io));
  }, 10000);

  console.log("[Starship Lounge] Resident Swarm (Kurt Gödel & Von Neumann) active.");
}
