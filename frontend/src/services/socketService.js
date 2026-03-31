import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
        reconnectionDelayMax: 30000,
        reconnectionDelay: 1000,
        randomizationFactor: 0.5,
      });

      this.socket.on('connect', () => {
        if (this.currentSessionId) {
          this.socket.emit('join_session', this.currentSessionId);
        }
      });

      // Bind all registered listeners to the new socket
      for (const [event, callbacks] of this.listeners.entries()) {
        callbacks.forEach(cb => this.socket.on(event, cb));
      }
    } else if (this.socket.connected && sessionId) {
      this.socket.emit('join_session', sessionId);
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
