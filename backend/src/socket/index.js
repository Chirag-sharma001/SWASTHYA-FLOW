const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: ['http://localhost:5173', 'http://localhost:5174', 'http://10.228.78.131:5173'], methods: ['GET', 'POST'] }
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
