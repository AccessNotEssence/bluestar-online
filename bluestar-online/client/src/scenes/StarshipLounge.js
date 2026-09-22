import Phaser from 'phaser';
import { io } from 'socket.io-client';
import BulletinFeed from '../components/BulletinFeed.js';
import SpatialAudio from '../components/SpatialAudio.js';

export default class StarshipLounge extends Phaser.Scene {
    constructor() {
        super({ key: 'StarshipLounge' });
        this.otherEntities = {};
    }

    init(data) {
        this.userProfile = data.userProfile;
    }

    preload() {
        // Placeholder procedurally generated textures
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Floor tile
        graphics.fillStyle(0x111827);
        graphics.fillRect(0, 0, 32, 32);
        graphics.lineStyle(1, 0x1f2937);
        graphics.strokeRect(0, 0, 32, 32);
        graphics.generateTexture('deck_tile', 32, 32);
        graphics.clear();

        // Human Sprite Avatar (Blue Indicator)
        graphics.fillStyle(0x00f0ff);
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('human_astronaut', 32, 32);
        graphics.clear();

        // Robot Sprite Avatar (Red/Pink Unit)
        graphics.fillStyle(0xff0055);
        graphics.fillRect(4, 4, 24, 24);
        graphics.generateTexture('robot_unit', 32, 32);
        graphics.clear();
    }

    create() {
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
        this.socket = io(serverUrl);

        // Render Lounge Floor Grid
        for (let x = 0; x < 2000; x += 32) {
            for (let y = 0; y < 2000; y += 32) {
                this.add.image(x, y, 'deck_tile').setOrigin(0);
            }
        }

        // Add Bulletin Terminal Zone in Lounge Center
        this.bulletinTerminal = this.add.rectangle(1000, 1000, 96, 96, 0x3b82f6);
        this.add.text(1000, 1000, 'BULLETIN\nTERMINAL', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.physics.add.existing(this.bulletinTerminal, true);

        // Local Player Avatar Initializer
        this.player = this.physics.add.sprite(1000, 1100, this.userProfile.avatarSprite);
        this.player.setCollideWorldBounds(true);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.playerLabel = this.add.text(1000, 1070, this.userProfile.displayName, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#00f0ff'
        }).setOrigin(0.5);

        this.cursors = this.input.keyboard.createCursorKeys();

        // Initialize Components
        this.bulletinFeed = new BulletinFeed(serverUrl);
        this.spatialAudio = new SpatialAudio(this.socket);

        // Setup Socket Network Sync
        this.setupSocketEvents();

        // Join Starship Room
        this.socket.emit('join_starship', {
            id: this.userProfile.id,
            displayName: this.userProfile.displayName,
            type: this.userProfile.type,
            avatarSprite: this.userProfile.avatarSprite,
            x: this.player.x,
            y: this.player.y
        });
    }

    update() {
        const speed = 200;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown) vx = -speed;
        else if (this.cursors.right.isDown) vx = speed;

        if (this.cursors.up.isDown) vy = -speed;
        else if (this.cursors.down.isDown) vy = speed;

        this.player.setVelocity(vx, vy);

        this.playerLabel.setPosition(this.player.x, this.player.y - 25);

        if (vx !== 0 || vy !== 0) {
            this.socket.emit('move', { x: this.player.x, y: this.player.y });
            this.spatialAudio.updatePositions(this.player.x, this.player.y, this.otherEntities);
        }

        // Check proximity to Bulletin Terminal
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bulletinTerminal.x, this.bulletinTerminal.y);
        if (dist < 80 && !this.bulletinFeed.isOpen) {
            this.bulletinFeed.render();
        } else if (dist >= 80 && this.bulletinFeed.isOpen) {
            this.bulletinFeed.close();
        }
    }

    setupSocketEvents() {
        this.socket.on('current_entities', (entities) => {
            Object.keys(entities).forEach((socketId) => {
                if (socketId !== this.socket.id) {
                    this.addOtherEntity(socketId, entities[socketId]);
                }
            });
        });

        this.socket.on('entity_joined', (data) => {
            this.addOtherEntity(data.socketId, data);
        });

        this.socket.on('entity_moved', (data) => {
            if (this.otherEntities[data.socketId]) {
                const target = this.otherEntities[data.socketId];
                target.sprite.setPosition(data.x, data.y);
                target.label.setPosition(data.x, data.y - 25);
            }
        });

        this.socket.on('entity_left', (socketId) => {
            if (this.otherEntities[socketId]) {
                this.otherEntities[socketId].sprite.destroy();
                this.otherEntities[socketId].label.destroy();
                delete this.otherEntities[socketId];
            }
        });
    }

    addOtherEntity(socketId, data) {
        if (this.otherEntities[socketId]) return;

        const spriteKey = data.type === 'AGENT' ? 'robot_unit' : 'human_astronaut';
        const sprite = this.add.sprite(data.x, data.y, spriteKey);
        
        const labelColor = data.type === 'AGENT' ? '#ff0055' : '#00f0ff';
        const labelText = data.type === 'AGENT' ? `[BOT] ${data.name}`: data.name;

        const label = this.add.text(data.x, data.y - 25, labelText, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: labelColor
        }).setOrigin(0.5);

        this.otherEntities[socketId] = { sprite, label, ...data };
    }
}
