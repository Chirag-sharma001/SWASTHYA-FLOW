const { Server } = require('socket.io');

let io;

function initSocket(server) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://10.228.78.131:5173',
  ];
  // In production, FRONTEND_URL is set as an env var (e.g. https://swasthqueuee.vercel.app)
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
    // Vercel serverless cannot maintain a persistent WS connection — use polling as fallback
    transports: ['polling', 'websocket'],
  });

  io.on('connection', (socket) => {
    socket.on('join_session', (sessionId) => {
      socket.join(sessionId);
    });
  });
}

function emitToSession(sessionId, event, payload) {
  if (io) {
    // Broadcast to all clients for MVP as per design.md
    io.emit(event, payload);
  }
}

module.exports = { initSocket, emitToSession };
