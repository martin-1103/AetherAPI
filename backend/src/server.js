import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { setupWebSocket } from './websocket.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import endpointRoutes from './routes/endpoints.js';
import environmentRoutes from './routes/environments.js';

dotenv.config();

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', endpointRoutes);
app.use('/api', environmentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Manager backend is running' });
});

setupWebSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});
