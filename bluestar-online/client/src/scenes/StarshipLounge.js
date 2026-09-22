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
    const terminal = this.add.rectangle(400, 250, 100, 100, 0x3b82f6);
    this.add.text(400, 250, 'BULLETIN\nTERMINAL', {
      fontSize: '10px',
      fontFamily: 'monospace',
      align: 'center',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 3. Retrieve local officer name or generate persistent Officer ID
    let savedName = localStorage.getItem('bluestar_officer_name');
    if (!savedName) {
      savedName = `Officer_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('bluestar_officer_name', savedName);
    }

    // 4. Create player entity circle and label
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

    // Register presence with server
    this.socket.emit('joinLounge', {
      name: savedName,
      x: startX,
      y: startY
    });

    // Listen for other entities joining
    this.socket.on('entityJoined', (data) => {
      this.addOtherEntity(data.id, data);
    });

    // Listen for entity movement updates
    this.socket.on('entityMoved', (data) => {
      if (this.otherEntities[data.id]) {
        this.otherEntities[data.id].x = data.x;
        this.otherEntities[data.id].y = data.y;
      }
    });

    // Listen for entity disconnections
    this.socket.on('entityLeft', (id) => {
      if (this.otherEntities[id]) {
        this.otherEntities[id].destroy();
        delete this.otherEntities[id];
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
      this.targetPosition = { x: pointer.worldX, y: pointer.worldY };
    });

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        this.targetPosition = { x: pointer.worldX, y: pointer.worldY };
      }
    });

    // 7. Initialize Chat UI
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
    if (this.otherEntities[id] || id === this.socket.id) return;

    const isAgent = data.type === 'AGENT';
    const color = isAgent ? 0xff0055 : 0x00f0ff;
    const labelText = isAgent ? [BOT] ${data.name} : data.name;

    const circle = this.add.circle(0, 0, 12, color);
    const label = this.add.text(0, -22, labelText, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: isAgent ? '#ff0055' : '#00f0ff'
    }).setOrigin(0.5);

    const container = this.add.container(data.x, data.y, [circle, label]);
    this.otherEntities[id] = container;
  }

  createChatUI(officerName) {
    if (document.getElementById('chat-input-container')) return;

    const container = document.createElement('div');
    container.id = 'chat-input-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      gap: 10px;
      background: rgba(10, 15, 29, 0.85);
      padding: 8px 12px;
      border: 1px solid #00f0ff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Transmit signal... (Press Enter)';
    input.style.cssText = `
      background: transparent;
      border: none;
      outline: none;
      color: #00f0ff;
      font-family: monospace;
      font-size: 14px;
      width: 240px;
    `;

    container.appendChild(input);
    document.body.appendChild(container);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim() !== '') {
        if (this.socket) {
          this.socket.emit('chatMessage', input.value);
        }
        input.value = '';
      }
    });
  }
}
