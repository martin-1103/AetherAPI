import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }) {
  const { token, user } = useAuth();
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (token && !wsRef.current) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  const connectWebSocket = () => {
    const socket = new WebSocket('ws://localhost:3001/ws');

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      socket.send(JSON.stringify({ type: 'auth', token }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleMessage(message);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      wsRef.current = null;
      
      setTimeout(() => {
        if (token) {
          connectWebSocket();
        }
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = socket;
    setWs(socket);
  };

  const handleMessage = (message) => {
    switch (message.type) {
      case 'auth-success':
        console.log('WebSocket authenticated');
        break;
      case 'room-joined':
        setActiveUsers(message.activeUsers || []);
        break;
      case 'user-joined':
        setActiveUsers(message.activeUsers || []);
        break;
      case 'user-left':
        setActiveUsers(prev => prev.filter(u => u.id !== message.user.id));
        break;
      default:
        break;
    }
  };

  const joinRoom = (projectId, endpointId = null) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join-room',
        projectId,
        endpointId
      }));
    }
  };

  const leaveRoom = (roomId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave-room',
        roomId
      }));
    }
  };

  const sendUpdate = (roomId, endpoint) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'endpoint-update',
        roomId,
        endpoint
      }));
    }
  };

  const value = {
    ws,
    connected,
    activeUsers,
    joinRoom,
    leaveRoom,
    sendUpdate
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}
