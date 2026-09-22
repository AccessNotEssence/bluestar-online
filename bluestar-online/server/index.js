const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const initSockets = require('./sockets/movement');

dotenv.config();

const authRoutes = require('./routes/auth');
const feedRoutes = require('./routes/feed');
const agentRoutes = require('./routes/agents');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/agents', agentRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ONLINE', vessel: 'BlueStar-01' });
});

// Initialize Socket.io spatial engine
initSockets(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[BlueStar Server] Running on port ${PORT}`);
});
