const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Nouvelle connexion Socket.IO:', socket.id);

    socket.on('disconnect', () => {
      console.log('Déconnexion Socket.IO:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO n\'est pas initialisé');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
}; 