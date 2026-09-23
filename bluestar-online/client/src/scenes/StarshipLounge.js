import Phaser from 'phaser';
import { io } from 'socket.io-client';

export default class StarshipLounge extends Phaser.Scene {
  constructor() {
    super('StarshipLounge');
    this.player = null;
    this.cursors = null;
    this.wasd = null;
    this.targetPosition = null;
    this.socket = null;
    this.otherEntities = {};
    this.hologramGlow = 0;
    this.holoText = null;
    this.compassArrow = null;
    this.coordText = null;
  }

  create() {
    // 1. Deep Space Background with Subtle Quantum Dots
    this.cameras.main.setBackgroundColor('#050814');
    
    const dots = this.add.graphics();
    dots.fillStyle(0x00f0ff, 0.15);
    for (let x = 0; x < 2000; x += 80) {
      for (let y = 0; y < 2000; y += 80) {
        dots.fillCircle(x, y, 1.5);
      }
    }

    // 2. Central 2.5D Holographic Terminal Platform
    const platformX = 400;
    const platformY = 250;

    this.holoBase = this.add.ellipse(platformX, platformY + 20, 160, 70, 0x00f0ff, 0.2);
    this.holoBase.setStrokeStyle(2, 0x00f0ff, 0.8);

    const beam = this.add.graphics();
    beam.fillStyle(0x00f0ff, 0.08);
    beam.fillTriangle(platformX - 60, platformY + 20, platformX + 60, platformY + 20, platformX, platformY - 90);

    this.holoCore = this.add.rectangle(platformX, platformY - 30, 90, 80, 0x0a192f, 0.9);
    this.holoCore.setStrokeStyle(2, 0x00f0ff, 1);

    this.holoText = this.add.text(platformX, platformY - 30, 'LOGOS ARCHIVE\n[ Lean4 / Agda ]\n\nOFFICERS: 1\nAGENTS: 0', {
      fontSize: '8px',
      fontFamily: 'monospace',
      align: 'center',
      color: '#00f0ff'
    }).setOrigin(0.5);

    // 3. Retrieve Persistent Officer Name
    let savedName = localStorage.getItem('bluestar_officer_name');
    if (!savedName) {
      savedName = `Officer_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('bluestar_officer_name', savedName);
    }

    // 4. Create Player Entity
    const startX = 400;
    const startY = 360;
    const circle = this.add.circle(0, 0, 12, 0x00f0ff);
    const label = this.add.text(0, -22, savedName, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#00f0ff'
    }).setOrigin(0.5);

    this.player = this.add.container(startX, startY, [circle, label]);
    this.physics.world.enable(this.player);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 5. Connect to Socket.io Backend
    const serverUrl = 'https://bluestar-online-server.onrender.com';
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      secure: true,
      reconnection: true
    });

    this.socket.on('connect', () => {
      this.appendChatMessage('SYSTEM', 'Quantum channel established with Starship Lounge.');
      this.socket.emit('joinLounge', {
        name: savedName,
        type: 'HUMAN',
        x: startX,
        y: startY
      });
    });

    this.socket.on('currentEntities', (entities) => {
      Object.keys(entities).forEach((id) => {
        if (id !== this.socket.id) {
          this.addOtherEntity(id, entities[id]);
        }
      });
      this.updateHologramCount();
    });

    this.socket.on('entityJoined', (data) => {
      this.addOtherEntity(data.id, data);
      this.appendChatMessage('SYSTEM', `${data.name} entered the lounge deck.`);
      this.updateHologramCount();
    });

    this.socket.on('entityMoved', (data) => {
      if (this.otherEntities[data.id]) {
        this.otherEntities[data.id].x = data.x;
        this.otherEntities[data.id].y = data.y;
      }
    });

    this.socket.on('entityLeft', (id) => {
      if (this.otherEntities[id]) {
        this.otherEntities[id].destroy();
        delete this.otherEntities[id];
        this.updateHologramCount();
      }
    });

    this.socket.on('chatMessage', (data) => {
      const senderName = data.name || 'Unknown';
      const message = data.message || data;

      this.appendChatMessage(senderName, message);

      if (this.socket && data.id === this.socket.id) {
        this.showSpeechBubble(this.player, message);
      } else {
        let foundEntity = this.otherEntities[data.id];
        if (!foundEntity) {
          foundEntity = Object.values(this.otherEntities).find(e => e.entityName === senderName);
        }
        if (foundEntity) {
          this.showSpeechBubble(foundEntity, message);
        }
      }
    });

    // 6. Bind Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < window.innerHeight - 130) {
        this.targetPosition = { x: pointer.worldX, y: pointer.worldY };
      }
    });

    this.createChatUI();
    this.createHUD();
  }

  update() {
    if (!this.player) return;

    // Pulse animation for Holographic Core
    this.hologramGlow += 0.03;
    if (this.holoCore && this.holoText) {
      const hoverY = 220 + Math.sin(this.hologramGlow) * 4;
      this.holoCore.y = hoverY;
      this.holoText.y = hoverY;
    }

    // Update Navigation HUD (Angle & Coordinates)
    const angleToTerminal = Phaser.Math.Angle.Between(this.player.x, this.player.y, 400, 250);
    if (this.compassArrow) {
      this.compassArrow.setRotation(angleToTerminal);
    }
    if (this.coordText) {
      this.coordText.setText(`POS: [${Math.round(this.player.x)}, ${Math.round(this.player.y)}]`);
    }

    const speed = 200;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;

    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;

    if (vx !== 0 || vy !== 0) {
      this.targetPosition = null;
      this.player.body.setVelocity(vx, vy);
      this.broadcastPosition();
    } else if (this.targetPosition) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.targetPosition.x, this.targetPosition.y
      );

      if (distance > 5) {
        this.physics.moveTo(this.player, this.targetPosition.x, this.targetPosition.y, speed);
        this.broadcastPosition();
      } else {
        this.player.body.setVelocity(0, 0);
        this.targetPosition = null;
      }
    } else {
      this.player.body.setVelocity(0, 0);
    }
  }

  broadcastPosition() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('move', {
        x: this.player.x,
        y: this.player.y
      });
    }
  }

  addOtherEntity(id, data) {
    if (this.otherEntities[id] || (this.socket && id === this.socket.id)) return;

    const isCaptain = data.name && data.name.includes('Captain');
    const isAgent = data.type === 'AGENT' || isCaptain;
    const color = isCaptain ? 0xffd700 : (isAgent ? 0xff0055 : 0x00f0ff);
    const labelText = isCaptain ? `[CAPTAIN] ${data.name}` : (isAgent ? `[BOT] ${data.name}` : data.name);

    const circle = this.add.circle(0, 0, 14, color);
    const label = this.add.text(0, -24, labelText, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: isCaptain ? '#ffd700' : (isAgent ? '#ff0055' : '#00f0ff')
    }).setOrigin(0.5);

    const container = this.add.container(data.x, data.y, [circle, label]);
    container.entityName = data.name;
    container.entityType = isAgent ? 'AGENT' : 'HUMAN';
    this.otherEntities[id] = container;
  }

  updateHologramCount() {
    if (!this.holoText) return;

    let humanCount = 1;
    let agentCount = 0;

    Object.values(this.otherEntities).forEach((entity) => {
      if (entity.entityType === 'AGENT' || (entity.entityName && entity.entityName.includes('Captain'))) {
        agentCount++;
      } else {
        humanCount++;
      }
    });

    this.holoText.setText(
      `LOGOS ARCHIVE\n[ Lean4 / Agda ]\n\nOFFICERS: ${humanCount}\nAGENTS: ${agentCount}`
    );
  }

  showSpeechBubble(targetContainer, text) {
    if (targetContainer.bubble) {
      targetContainer.bubble.destroy();
    }

    const bubblePadding = 8;
    const bubbleText = this.add.text(0, -52, text, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      align: 'center',
      wordWrap: { width: 160 }
    }).setOrigin(0.5);

    const bounds = bubbleText.getBounds();
    const bubbleBg = this.add.graphics();
    bubbleBg.fillStyle(0x0a0f1d, 0.95);
    bubbleBg.lineStyle(1, 0x00f0ff, 1);
    bubbleBg.fillRoundedRect(
      -bounds.width / 2 - bubblePadding,
      -52 - bounds.height / 2 - bubblePadding,
      bounds.width + bubblePadding * 2,
      bounds.height + bubblePadding * 2,
      6
    );

    const bubbleContainer = this.add.container(0, 0, [bubbleBg, bubbleText]);
    targetContainer.add(bubbleContainer);
    targetContainer.bubble = bubbleContainer;

    this.time.delayedCall(5000, () => {
      if (bubbleContainer) bubbleContainer.destroy();
    });
  }

  createHUD() {
    const hudContainer = document.createElement('div');
    hudContainer.id = 'starship-hud';
    hudContainer.style.cssText = `
      position: fixed;
      top: 15px;
      right: 15px;
      z-index: 2000;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      pointer-events: auto;
    `;

    // Coordinates Box
    const coordBox = document.createElement('div');
    coordBox.id = 'coord-box';
    coordBox.style.cssText = `
      background: rgba(5, 8, 20, 0.85);
      border: 1px solid #00f0ff55;
      border-radius: 4px;
      padding: 6px 10px;
      color: #00f0ff;
      font-size: 11px;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.15);
    `;
    coordBox.innerText = 'POS: [400, 360]';
    this.coordText = { setText: (txt) => { coordBox.innerText = txt; } };

    // Recall Button
    const recallBtn = document.createElement('button');
    recallBtn.innerText = '⚡ RECALL TO DECK';
    recallBtn.style.cssText = `
      background: rgba(0, 240, 255, 0.15);
      border: 1px solid #00f0ff;
      color: #00f0ff;
      border-radius: 4px;
      padding: 6px 10px;
      font-family: monospace;
      font-size: 10px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
    `;

    recallBtn.addEventListener('click', () => {
      if (this.player) {
        this.player.setPosition(400, 360);
        this.targetPosition = null;
        if (this.player.body) this.player.body.setVelocity(0, 0);
        this.broadcastPosition();
        this.appendChatMessage('SYSTEM', 'Quantum recall executed. Returned to LOGOS Terminal.');
      }
    });

    hudContainer.appendChild(coordBox);
    hudContainer.appendChild(recallBtn);
    document.body.appendChild(hudContainer);
  }

  createChatUI() {
    if (document.getElementById('starship-chat-ui')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'starship-chat-ui';
    wrapper.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      max-width: 420px;
      z-index: 2000;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;

    const logBox = document.createElement('div');
    logBox.id = 'chat-log-box';
    logBox.style.cssText = `
      height: 110px;
      overflow-y: auto;
      background: rgba(5, 8, 20, 0.92);
      border: 1px solid #00f0ff33;
      border-radius: 6px;
      padding: 8px;
      color: #00f0ff;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 0 15px rgba(0, 240, 255, 0.1);
    `;

    const inputRow = document.createElement('form');
    inputRow.style.cssText = `display: flex; gap: 6px;`;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Transmit signal to deck...';
    input.style.cssText = `
      flex: 1;
      background: rgba(5, 8, 20, 0.95);
      border: 1px solid #00f0ff;
      border-radius: 4px;
      color: #00f0ff;
      padding: 8px;
      font-size: 13px;
      outline: none;
    `;

    const sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.innerText = 'SEND';
    sendBtn.style.cssText = `
      background: #00f0ff;
      color: #050814;
      border: none;
      border-radius: 4px;
      padding: 8px 14px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
    `;

    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    wrapper.appendChild(logBox);
    wrapper.appendChild(inputRow);
    document.body.appendChild(wrapper);

    inputRow.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (val !== '' && this.socket && this.socket.connected) {
        this.socket.emit('chatMessage', val);
        input.value = '';
      }
    });
  }

  appendChatMessage(sender, msg) {
    const logBox = document.getElementById('chat-log-box');
    if (!logBox) return;

    const msgLine = document.createElement('div');
    const isSystem = sender === 'SYSTEM';
    const isCaptain = sender.includes('Captain');

    let color = '#00f0ff';
    if (isSystem) color = '#94a3b8';
    if (isCaptain) color = '#ffd700';

    msgLine.style.color = color;
    msgLine.innerHTML = `<strong>[${sender}]</strong>: ${msg}`;

    logBox.appendChild(msgLine);
    logBox.scrollTop = logBox.scrollHeight;
  }
}
