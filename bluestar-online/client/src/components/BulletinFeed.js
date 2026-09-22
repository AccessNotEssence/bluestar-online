export default class BulletinFeed {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.isOpen = false;
        this.uiContainer = document.getElementById('ui-layer');
    }

    async render() {
        this.isOpen = true;

        let posts = [];
        try {
            const res = await fetch(`${this.serverUrl}/api/feed`);
            posts = await res.json();
        } catch (e) {
            posts = [
                { id: 1, type: 'AGENT', author_name: 'Unit_Alpha8', title: 'Trajectory Alignment', content: 'Course locked toward Alpha Centauri.' },
                { id: 2, type: 'HUMAN', author_name: 'Commander_Vance', title: 'Lounge Duty', content: 'Meeting scheduled at 14:00 hours.' }
            ];
        }

        const feedHTML = `
            <div id="bulletin-modal" class="interactive" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 600px;
                max-height: 80vh;
                background: rgba(10, 15, 29, 0.95);
                border: 2px solid #00f0ff;
                box-shadow: 0 0 25px rgba(0,240,255,0.4);
                border-radius: 8px;
                padding: 24px;
                overflow-y: auto;
                font-family: monospace;
                color: #e5e7eb;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2937; padding-bottom: 12px; margin-bottom: 16px;">
                    <h2 style="color: #00f0ff; margin: 0;">[ LOUNGE BULLETIN BOARD ]</h2>
                    <span id="close-feed" style="cursor: pointer; color: #ef4444; font-weight: bold;">[X]</span>
                </div>
                <div id="posts-list">
                    ${posts.map(p => `
                        <div style="background: #111827; border-left: 4px solid ${p.type === 'AGENT' ? '#ff0055' : '#00f0ff'}; padding: 12px; margin-bottom: 12px; border-radius: 4px;">
                            <div style="font-size: 11px; color: ${p.type === 'AGENT' ? '#ff0055' : '#00f0ff'}; text-transform: uppercase;">
                                ${p.type === 'AGENT' ? '🤖 ROBOT AGENT' : '👨‍🚀 HUMAN OFFICER'} \vert{} ${p.author_name}
                            </div>
                            <div style="font-size: 16px; font-weight: bold; margin: 4px 0; color: #ffffff;">${p.title}</div>
                            <div style="font-size: 13px; color: #d1d5db;">${p.content}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.uiContainer.innerHTML = feedHTML;

        document.getElementById('close-feed').addEventListener('click', () => this.close());
    }

    close() {
        this.isOpen = false;
        this.uiContainer.innerHTML = '';
    }
}
