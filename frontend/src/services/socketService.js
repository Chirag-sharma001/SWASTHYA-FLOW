import { io } from 'socket.io-client';

// In production (Vercel), connect directly to the backend URL via VITE_API_URL.
// In dev, the Vite proxy handles /socket.io/* via the same origin (empty string).
const SOCKET_URL = import.meta.env.VITE_API_URL || '';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.currentSessionId = null;
  }

  connect(sessionId) {
    if (sessionId) {
      this.currentSessionId = sessionId;
    }

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        // Start with long-polling (works everywhere), upgrade to WS if possible
        transports: ['polling', 'websocket'],
        reconnectionDelayMax: 30000,
        reconnectionDelay: 1000,
        randomizationFactor: 0.5,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected:', this.socket.id);
        if (this.currentSessionId) {
          this.socket.emit('join_session', this.currentSessionId);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      this.socket.on('reconnect', () => {
        console.log('[Socket] Reconnected');
        if (this.currentSessionId) {
          this.socket.emit('join_session', this.currentSessionId);
        }
      });

      // Bind all registered listeners to the new socket
      for (const [event, callbacks] of this.listeners.entries()) {
        callbacks.forEach(cb => this.socket.on(event, cb));
      }
    } else if (sessionId && this.socket.connected) {
      this.socket.emit('join_session', sessionId);
    } else if (sessionId && !this.socket.connected) {
      // Will join on next connect event via currentSessionId
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    
    if (this.socket && callback) {
      this.socket.off(event, callback);
    } else if (this.socket) {
      this.socket.off(event);
    }
  }
}

export const socketService = new SocketService();
