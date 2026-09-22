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
  }

  create() {
    // 1. Draw geometric grid background
    this.add.grid(0, 0, 2000, 2000, 40, 40, 0x0a0f1d, 1, 0x1a2638, 0.5);

    // 2. Create central starship bulletin terminal
    const terminal = this.add.rectangle(400, 250, 120, 80, 0x1e293b);
    terminal.setStrokeStyle(2, 0x3b82f6);
    this.add.text(400, 250, 'LOGOS & ARCHIVE\nTERMINAL\n(Lean4 / Agda)', {
      fontSize: '10px',
      fontFamily: 'monospace',
      align: 'center',
      color: '#00f0ff'
    }).setOrigin(0.5);

    // 3. Retrieve persistent officer name
    let savedName = localStorage.getItem('bluestar_officer_name');
    if (!savedName) {
      savedName = `Officer_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('bluestar_officer_name', savedName);
    }

    // 4. Create player entity
    const startX = 400;
    const startY = 320;
    const circle = this.add.circle(0, 0, 12, 0x00f0ff);
    const label = this.add.text(0, -22, savedName, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#00f0ff'
    }).setOrigin(0.5);

    this.player = this.add.container(startX, startY, [circle, label]);
    this.physics.world.enable(this.player);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 5. Connect to Socket.io backend
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://bluestar-online-server.onrender.com';
    this.socket = io(serverUrl);

    this.socket.emit('joinLounge', {
      name: savedName,
      type: 'HUMAN',
      x: startX,
      y: startY
    });

    this.socket.on('currentEntities', (entities) => {
      Object.keys(entities).forEach((id) => {
        if (id !== this.socket.id) {
          this.addOtherEntity(id, entities[id]);
        }
      });
    });

    this.socket.on('entityJoined', (data) => {
      this.addOtherEntity(data.id, data);
      this.appendChatMessage('SYSTEM', `${data.name} entered the lounge deck.`);
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
      }
    });

    this.socket.on('chatMessage', (data) => {
      const senderName = data.name || 'Unknown';
      this.appendChatMessage(senderName, data.message);

      if (this.socket && data.id === this.socket.id) {
        this.showSpeechBubble(this.player, data.message);
      } else if (this.otherEntities[data.id]) {
        this.showSpeechBubble(this.otherEntities[data.id], data.message);
      }
    });

    // 6. Bind inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < window.innerHeight - 120) {
        this.targetPosition = { x: pointer.worldX, y: pointer.worldY };
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && pointer.y < window.innerHeight - 120) {
        this.targetPosition = { x: pointer.worldX, y: pointer.worldY };
      }
    });

    // 7. Initialize Chat Channel UI
    this.createChatUI(savedName);
  }

  update() {
    if (!this.player) return;

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
    if (this.socket) {
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
    this.otherEntities[id] = container;
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
    bubbleBg.strokeRoundedRect(
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
      pointer-events: auto;
    `;

    // Scrollable broadcast channel window (Chat Log Box)
    const logBox = document.createElement('div');
    logBox.id = 'chat-log-box';
    logBox.style.cssText = `
      height: 110px;
      overflow-y: auto;
      background: rgba(10, 15, 29, 0.88);
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 8px;
      color: #00f0ff;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 0 12px rgba(0, 240, 255, 0.15);
    `;

    // Input section (Input + Send Button)
    const inputRow = document.createElement('form');
    inputRow.style.cssText = `
      display: flex;
      gap: 6px;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Transmit signal...';
    input.style.cssText = `
      flex: 1;
      background: rgba(10, 15, 29, 0.95);
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
      color: #0a0f1d;
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

    const handleSend = (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (val !== '' && this.socket) {
        this.socket.emit('chatMessage', val);
        input.value = '';
      }
    };

    inputRow.addEventListener('submit', handleSend);
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
