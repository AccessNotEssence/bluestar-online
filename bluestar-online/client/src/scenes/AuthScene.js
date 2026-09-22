import Phaser from 'phaser';

export default class AuthScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AuthScene' });
    }

    create() {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0f1d);

        this.add.text(width / 2, height / 3, 'BLUESTAR ONLINE', {
            fontFamily: 'Courier, monospace',
            fontSize: '48px',
            color: '#00f0ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 3 + 60, 'Deep Space Communications & Social Vessel', {
            fontFamily: 'sans-serif',
            fontSize: '18px',
            color: '#9ca3af'
        }).setOrigin(0.5);

        const uiLayer = document.getElementById('ui-layer');
        uiLayer.innerHTML = `
            <div style="position: absolute; top: 60%; left: 50%; transform: translate(-50%, -50%); text-align: center;" class="interactive">
                <button id="google-login-btn" style="
                    background-color: #1f2937;
                    border: 2px solid #00f0ff;
                    color: #00f0ff;
                    padding: 14px 28px;
                    font-size: 16px;
                    font-family: monospace;
                    cursor: pointer;
                    border-radius: 4px;
                    box-shadow: 0 0 15px rgba(0,240,255,0.3);
                    transition: all 0.2s ease;">
                    [ INITIALIZE GOOGLE AUTHENTICATION ]
                </button>
            </div>
        `;

        document.getElementById('google-login-btn').addEventListener('click', () => {
            this.handleAuthentication();
        });
    }

    handleAuthentication() {
        const uiLayer = document.getElementById('ui-layer');
        uiLayer.innerHTML = '';

        const userProfile = {
            id: 'usr_' + Math.random().toString(36).substr(2, 9),
            displayName: 'Officer_' + Math.floor(1000 + Math.random() * 9000),
            type: 'HUMAN',
            avatarSprite: 'human_astronaut'
        };

        this.scene.start('StarshipLounge', { userProfile });
    }
}
