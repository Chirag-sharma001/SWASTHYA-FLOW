const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    socket.on('join_session', (sessionId) => {
      socket.join(sessionId);
    });
  });
}

function emitToSession(sessionId, event, payload) {
  if (io) {
    io.to(sessionId).emit(event, payload);
  }
}

module.exports = { initSocket, emitToSession };
