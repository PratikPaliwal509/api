const { Server } = require('socket.io');
let io = null;
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

 io.on('connection', (socket) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("No token provided");
      return socket.disconnect();
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    console.log("User connected:", userId);

    socket.join(userId);

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
    });

  } catch (error) {
    console.log("JWT Error:", error.message);
    socket.disconnect();
  }
});

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { initSocket, getIO };
