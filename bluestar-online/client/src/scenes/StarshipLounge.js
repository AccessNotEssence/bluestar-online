import Phaser from 'phaser';

export default class StarshipLounge extends Phaser.Scene {
  constructor() {
    super('StarshipLounge');
    this.player = null;
    this.cursors = null;
    this.wasd = null;
    this.targetPosition = null; // Store touch/pointer target position for mobile devices
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

    // 3. Retrieve local officer name, or generate a persistent Officer ID if none exists
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

    // Make camera follow player entity
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 5. Bind keyboard inputs (Desktop)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // 6. Bind touch & pointer drag events (Mobile)
    this.input.on('pointerdown', (pointer) => {
      this.targetPosition = { x: pointer.worldX, y: pointer.worldY };
    });

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        this.targetPosition = { x: pointer.worldX, y: pointer.worldY };
      }
    });

    // 7. Initialize overlay chat UI
    this.createChatUI(savedName);
  }

  update() {
    if (!this.player) return;

    const speed = 200;
    let vx = 0;
    let vy = 0;

    // Process desktop keyboard movement
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;

    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;

    if (vx !== 0 || vy !== 0) {
      // Clear touch target position when using keyboard
      this.targetPosition = null;
      this.player.body.setVelocity(vx, vy);
    } else if (this.targetPosition) {
      // Mobile touch navigation logic: move towards tapped/dragged coordinates
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.targetPosition.x, this.targetPosition.y
      );

      if (distance > 5) {
        this.physics.moveTo(this.player, this.targetPosition.x, this.targetPosition.y, speed);
      } else {
        this.player.body.setVelocity(0, 0);
        this.targetPosition = null;
      }
    } else {
      this.player.body.setVelocity(0, 0);
    }
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
        alert(`[${officerName} Signal Transmission]: ${input.value}`);
        input.value = '';
      }
    });
  }
}
