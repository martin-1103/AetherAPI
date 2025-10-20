import { WebSocketServer } from 'ws';
import { query } from './database.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const rooms = new Map();
const clients = new Map();

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'auth':
            await handleAuth(ws, message);
            break;
          case 'join-room':
            await handleJoinRoom(ws, message);
            break;
          case 'leave-room':
            handleLeaveRoom(ws, message);
            break;
          case 'endpoint-update':
            handleEndpointUpdate(ws, message);
            break;
          case 'cursor-move':
            handleCursorMove(ws, message);
            break;
          case 'presence-update':
            handlePresenceUpdate(ws, message);
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });

    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connection established' }));
  });

  return wss;
}

async function handleAuth(ws, message) {
  try {
    const { token } = message;
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const result = await query('SELECT id, username, email FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      ws.send(JSON.stringify({ type: 'auth-error', error: 'User not found' }));
      return;
    }

    ws.user = result.rows[0];
    clients.set(ws, { user: ws.user, rooms: new Set() });
    
    ws.send(JSON.stringify({ type: 'auth-success', user: ws.user }));
  } catch (error) {
    ws.send(JSON.stringify({ type: 'auth-error', error: 'Invalid token' }));
  }
}

async function handleJoinRoom(ws, message) {
  const { projectId, endpointId } = message;
  
  if (!ws.user) {
    ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated' }));
    return;
  }

  const roomId = `${projectId}:${endpointId || 'project'}`;
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  rooms.get(roomId).add(ws);
  const clientData = clients.get(ws);
  if (clientData) {
    clientData.rooms.add(roomId);
  }

  await query(
    `INSERT INTO collaboration_sessions (project_id, endpoint_id, user_id, is_active) 
     VALUES ($1, $2, $3, true)
     ON CONFLICT (user_id, project_id, endpoint_id) WHERE is_active = true
     DO UPDATE SET last_seen = CURRENT_TIMESTAMP`,
    [projectId, endpointId || null, ws.user.id]
  );

  const activeUsers = Array.from(rooms.get(roomId))
    .filter(client => clients.get(client))
    .map(client => clients.get(client).user);

  broadcastToRoom(roomId, {
    type: 'user-joined',
    user: ws.user,
    activeUsers: activeUsers
  }, ws);

  ws.send(JSON.stringify({
    type: 'room-joined',
    roomId: roomId,
    activeUsers: activeUsers
  }));
}

function handleLeaveRoom(ws, message) {
  const { roomId } = message;
  
  if (rooms.has(roomId)) {
    rooms.get(roomId).delete(ws);
    
    const clientData = clients.get(ws);
    if (clientData) {
      clientData.rooms.delete(roomId);
    }

    broadcastToRoom(roomId, {
      type: 'user-left',
      user: ws.user
    });
  }
}

function handleEndpointUpdate(ws, message) {
  const { roomId, endpoint } = message;
  
  broadcastToRoom(roomId, {
    type: 'endpoint-updated',
    endpoint: endpoint,
    user: ws.user
  }, ws);
}

function handleCursorMove(ws, message) {
  const { roomId, position } = message;
  
  broadcastToRoom(roomId, {
    type: 'cursor-moved',
    user: ws.user,
    position: position
  }, ws);
}

function handlePresenceUpdate(ws, message) {
  const { roomId, status } = message;
  
  broadcastToRoom(roomId, {
    type: 'presence-changed',
    user: ws.user,
    status: status
  }, ws);
}

function handleDisconnect(ws) {
  const clientData = clients.get(ws);
  
  if (clientData) {
    clientData.rooms.forEach(roomId => {
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(ws);
        
        broadcastToRoom(roomId, {
          type: 'user-left',
          user: ws.user
        });
      }
    });
    
    clients.delete(ws);
  }
}

function broadcastToRoom(roomId, message, excludeWs = null) {
  if (!rooms.has(roomId)) return;

  const messageStr = JSON.stringify(message);
  
  rooms.get(roomId).forEach(client => {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(messageStr);
    }
  });
}
